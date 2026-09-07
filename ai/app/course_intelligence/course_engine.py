import time
import logging
from typing import Dict, Any, List, Optional
from app.course_intelligence.provider_interface import CourseFilter, CourseItem
from app.course_intelligence.provider_manager import CourseProviderManager
from app.course_intelligence.course_normalizer import CourseNormalizer
from app.course_intelligence.course_validator import CourseValidator
from app.course_intelligence.course_ranker import CourseRanker
from app.course_intelligence.learning_path_builder import LearningPathBuilder
from app.course_intelligence.prerequisite_detector import PrerequisiteDetector
from app.course_intelligence.learning_estimator import LearningEstimator
from app.course_intelligence.cache_manager import CourseCacheManager
from app.course_intelligence.health_monitor import CourseHealthMonitor

logger = logging.getLogger("skillbridge-ai")

class CourseEngine:
    """
    Central Course Intelligence Engine orchestrator for SkillBridge.
    Unified facade providing multi-provider course discovery, normalization, ranking,
    structured learning path generation, prerequisite detection, and ROI estimation.
    """

    def __init__(self):
        self.provider_manager = CourseProviderManager()
        self.cache_manager = CourseCacheManager()
        self.health_monitor = CourseHealthMonitor()

    def discover_and_rank_courses(
        self,
        filter_params: CourseFilter,
        target_skills: Optional[List[str]] = None,
        user_skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        if target_skills is None:
            target_skills = [filter_params.skill or "Software Engineering"]
        if user_skills is None:
            user_skills = []

        cache_key = f"courses:{filter_params.skill}:{filter_params.provider}:{filter_params.difficulty}"
        cached = self.cache_manager.get(cache_key)
        if cached:
            return cached

        start_time = time.time()
        # 1. Fetch raw courses across active providers
        raw_courses = self.provider_manager.search_all_providers(filter_params)
        latency_ms = (time.time() - start_time) * 1000
        self.health_monitor.record_request("CourseEngine", latency_ms, True)

        # 2. Normalize and Deduplicate
        normalized = CourseNormalizer.deduplicate(raw_courses)

        # 3. Validate Quality
        valid_courses = CourseValidator.filter_valid_courses(normalized)

        # 4. Multi-Factor Ranking
        ranked_courses = CourseRanker.rank_courses(valid_courses, target_skills)

        # 5. Build Structured Learning Path
        learning_path = LearningPathBuilder.build_structured_path(valid_courses)

        # 6. Prerequisite Detection
        prereqs = PrerequisiteDetector.detect_missing_prerequisites(valid_courses, user_skills)

        # 7. Learning & ROI Estimation
        estimates = LearningEstimator.estimate_learning_outcomes(valid_courses)

        result = {
            "query": filter_params.model_dump(),
            "total_discovered": len(raw_courses),
            "valid_courses_count": len(valid_courses),
            "ranked_courses": ranked_courses,
            "learning_path": learning_path,
            "prerequisite_analysis": prereqs,
            "learning_estimates": estimates,
            "telemetry": {
                "latency_ms": round(latency_ms, 2),
                "cache": self.cache_manager.get_telemetry(),
                "system_health": self.health_monitor.get_system_health()
            }
        }

        self.cache_manager.set(cache_key, result, ttl_seconds=1800)
        return result

# Global Instance
course_engine_instance = CourseEngine()
