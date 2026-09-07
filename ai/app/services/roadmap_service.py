import time
import logging
from app.schemas.modules import RoadmapRequest, RoadmapResponse
from app.schemas.ai_response import UnifiedAIResponse
from app.utils.response_normalizer import ResponseNormalizer
from app.roadmap_intelligence.roadmap_pipeline import RoadmapPipeline

logger = logging.getLogger("skillbridge-ai")

# Singleton pipeline instance
_roadmap_pipeline = RoadmapPipeline()

def generate_roadmap_via_ai(request: RoadmapRequest) -> UnifiedAIResponse:
    """
    Generates adaptive, personalized learning roadmaps via RoadmapPipeline.
    Maintains 100% backward compatibility with existing schemas and API contracts.
    """
    start_time = time.time()

    pipeline_result = _roadmap_pipeline.process_roadmap(
        current_level=request.current_level,
        target_role=request.target_role,
        target_months=request.target_months,
        user_acquired_skills=request.user_skills,
        completed_milestones=request.completed_milestones,
        weekly_hours=request.weekly_hours_available or 15
    )

    latency_ms = (time.time() - start_time) * 1000

    return ResponseNormalizer.normalize_success(
        raw_data=pipeline_result,
        provider="roadmap_pipeline",
        model="adaptive-sequencer-v1",
        latency_ms=latency_ms,
        prompt_text=f"Level: {request.current_level}, Target: {request.target_role}, Months: {request.target_months}",
        completion_text=str(pipeline_result),
        metadata={
            "pipeline": "Adaptive AI Learning Roadmap Engine",
            "is_valid": pipeline_result.get("is_valid", True),
            "estimated_weeks": pipeline_result.get("estimated_weeks")
        }
    )
