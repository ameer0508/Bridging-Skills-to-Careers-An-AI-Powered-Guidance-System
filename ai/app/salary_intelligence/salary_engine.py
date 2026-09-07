import time
import logging
from typing import Dict, Any, List, Optional
from app.salary_intelligence.salary_provider import SalaryFilter, SalaryDataPoint
from app.salary_intelligence.provider_manager import SalaryProviderManager
from app.salary_intelligence.salary_normalizer import SalaryNormalizer
from app.salary_intelligence.salary_analyzer import SalaryAnalyzer
from app.salary_intelligence.salary_predictor import SalaryPredictor
from app.salary_intelligence.regional_comparator import RegionalComparator
from app.salary_intelligence.cache_manager import SalaryCacheManager
from app.salary_intelligence.health_monitor import SalaryHealthMonitor

logger = logging.getLogger("skillbridge-ai")

class SalaryEngine:
    """
    Central Salary Intelligence Engine orchestrator for SkillBridge.
    Unified facade combining Provider Management, Normalization, Analytics, AI Prediction,
    Regional Comparison, Caching, and System Health Monitoring.
    """

    def __init__(self):
        self.provider_manager = SalaryProviderManager()
        self.cache_manager = SalaryCacheManager()
        self.health_monitor = SalaryHealthMonitor()

    def get_salary_intelligence(self, filter_params: SalaryFilter) -> Dict[str, Any]:
        cache_key = f"salary:{filter_params.job_title}:{filter_params.location}:{filter_params.experience_level}"
        cached = self.cache_manager.get(cache_key)
        if cached:
            return cached

        start_time = time.time()
        # 1. Fetch raw data from providers
        raw_points = self.provider_manager.fetch_all(filter_params)

        # 2. Normalize currency, pay periods, and deduplicate
        normalized_points = SalaryNormalizer.deduplicate_and_normalize(raw_points)

        # Record health metrics
        latency_ms = (time.time() - start_time) * 1000
        self.health_monitor.record_request("SalaryEngine", latency_ms, True)

        # 3. Statistical Analysis
        analytics = SalaryAnalyzer.analyze_dataset(normalized_points)

        # 4. AI Salary Prediction & ROI
        prediction = SalaryPredictor.predict_user_compensation(
            verified_skills=filter_params.skills or ["Python", "FastAPI"],
            experience_years=4.0,
            target_role=filter_params.job_title or "Software Engineer",
            base_market_median=analytics["median"] or 150000.0
        )

        # 5. Regional Comparison
        regional_comparison = RegionalComparator.compare_regions(analytics["median"] or 150000.0)

        result = {
            "query": filter_params.model_dump(),
            "data_points_count": len(normalized_points),
            "analytics": analytics,
            "prediction": prediction,
            "regional_comparison": regional_comparison,
            "telemetry": {
                "latency_ms": round(latency_ms, 2),
                "cache": self.cache_manager.get_telemetry(),
                "system_health": self.health_monitor.get_system_health()
            }
        }

        self.cache_manager.set(cache_key, result, ttl_seconds=1800)
        return result

# Global Instance
salary_engine_instance = SalaryEngine()
