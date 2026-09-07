import time
import logging
from app.schemas.modules import AnalyticsRequest, AnalyticsResponse
from app.schemas.ai_response import UnifiedAIResponse
from app.utils.response_normalizer import ResponseNormalizer
from app.predictive_analytics.analytics_pipeline import AnalyticsPipeline

logger = logging.getLogger("skillbridge-ai")

# Singleton pipeline instance
_analytics_pipeline = AnalyticsPipeline()

def generate_analytics_via_ai(request: AnalyticsRequest) -> UnifiedAIResponse:
    """
    Generates predictive career intelligence, readiness trajectories, salary predictions, and scenario simulations via AnalyticsPipeline.
    Maintains 100% backward compatibility with existing schemas and API contracts.
    """
    start_time = time.time()

    pipeline_result = _analytics_pipeline.process_analytics(
        user_id=request.user_id,
        target_role=request.target_role or "Senior AI Engineer",
        current_level=request.current_level or "mid",
        user_skills=request.user_skills,
        skills_trend=request.skills_trend,
        simulation_scenario=request.simulation_scenario
    )

    latency_ms = (time.time() - start_time) * 1000

    return ResponseNormalizer.normalize_success(
        raw_data=pipeline_result,
        provider="predictive_analytics_pipeline",
        model="career-forecaster-v1",
        latency_ms=latency_ms,
        prompt_text=f"User: {request.user_id}, Target: {request.target_role}",
        completion_text=str(pipeline_result),
        metadata={
            "pipeline": "Predictive Analytics & Career Intelligence Engine",
            "is_valid": pipeline_result.get("is_valid", True)
        }
    )
