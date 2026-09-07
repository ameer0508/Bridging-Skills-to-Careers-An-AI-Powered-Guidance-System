import time
import logging
from typing import Dict, Any, List, Optional
from app.certification_intelligence.provider_interface import CertificationFilter, CertificationItem
from app.certification_intelligence.provider_manager import CertificationProviderManager
from app.certification_intelligence.certification_normalizer import CertificationNormalizer
from app.certification_intelligence.certification_validator import CertificationValidator
from app.certification_intelligence.certification_ranker import CertificationRanker
from app.certification_intelligence.certification_path_builder import CertificationPathBuilder
from app.certification_intelligence.prerequisite_analyzer import PrerequisiteAnalyzer
from app.certification_intelligence.roi_estimator import CertificationROIEstimator
from app.certification_intelligence.renewal_tracker import RenewalTracker
from app.certification_intelligence.cache_manager import CertificationCacheManager
from app.certification_intelligence.health_monitor import CertificationHealthMonitor

logger = logging.getLogger("skillbridge-ai")

class CertificationEngine:
    """
    Central Certification Intelligence Engine orchestrator for SkillBridge.
    Unified facade providing multi-provider certification discovery, normalization, ranking,
    certification path generation, ROI estimation, and renewal tracking.
    """

    def __init__(self):
        self.provider_manager = CertificationProviderManager()
        self.cache_manager = CertificationCacheManager()
        self.health_monitor = CertificationHealthMonitor()

    def discover_and_rank_certifications(
        self,
        filter_params: CertificationFilter,
        target_skills: Optional[List[str]] = None,
        user_skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        if target_skills is None:
            target_skills = [filter_params.technology or "Cloud & AI Architecture"]
        if user_skills is None:
            user_skills = []

        cache_key = f"certs:{filter_params.technology}:{filter_params.provider}:{filter_params.level}"
        cached = self.cache_manager.get(cache_key)
        if cached:
            return cached

        start_time = time.time()
        # 1. Fetch raw certifications across active providers
        raw_certs = self.provider_manager.fetch_all_certifications(filter_params)
        latency_ms = (time.time() - start_time) * 1000
        self.health_monitor.record_request("CertificationEngine", latency_ms, True)

        # 2. Normalize & Deduplicate
        normalized = CertificationNormalizer.deduplicate(raw_certs)

        # 3. Validate Data
        valid_certs = CertificationValidator.filter_valid_certifications(normalized)

        # 4. Multi-Factor Ranking
        ranked_certs = CertificationRanker.rank_certifications(valid_certs, target_skills)

        # 5. Build Certification Progression Path
        cert_path = CertificationPathBuilder.build_certification_path(valid_certs)

        # 6. Prerequisite Analysis
        prereqs = PrerequisiteAnalyzer.analyze_prerequisites(valid_certs, user_skills)

        # 7. ROI Estimation
        roi = CertificationROIEstimator.estimate_certification_roi(valid_certs)

        # 8. Renewal Metadata
        renewals = RenewalTracker.get_renewal_metadata(valid_certs)

        result = {
            "query": filter_params.model_dump(),
            "total_discovered": len(raw_certs),
            "valid_certifications_count": len(valid_certs),
            "ranked_certifications": ranked_certs,
            "certification_path": cert_path,
            "prerequisite_analysis": prereqs,
            "roi_estimates": roi,
            "renewal_tracking": renewals,
            "telemetry": {
                "latency_ms": round(latency_ms, 2),
                "cache": self.cache_manager.get_telemetry(),
                "system_health": self.health_monitor.get_system_health()
            }
        }

        self.cache_manager.set(cache_key, result, ttl_seconds=1800)
        return result

# Global Instance
certification_engine_instance = CertificationEngine()
