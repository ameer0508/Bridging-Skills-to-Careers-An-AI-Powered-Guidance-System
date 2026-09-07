import time
import logging
from app.gateway.ai_gateway import ai_gateway
from app.schemas.modules import RecommendationRequest, RecommendationResponse
from app.schemas.ai_response import UnifiedAIResponse
from app.recommendation_intelligence.recommendation_pipeline import ExplainableRecommendationPipeline
from app.utils.response_normalizer import ResponseNormalizer

logger = logging.getLogger("skillbridge-ai")

def generate_recommendations_via_ai(request: RecommendationRequest) -> UnifiedAIResponse:
    start_time = time.time()
    try:
        logger.info(f"[RecommendationService] Executing ExplainableRecommendationPipeline for goal '{request.career_goal}'")
        pipeline_result = ExplainableRecommendationPipeline.execute(
            user_skills=request.user_skills,
            career_goal=request.career_goal,
            learning_style=request.preferred_learning_style or "hands-on",
            completed_learning=request.completed_learning
        )
        latency = (time.time() - start_time) * 1000

        return ResponseNormalizer.normalize_success(
            raw_data=pipeline_result.model_dump(),
            provider="recommendation_intelligence",
            model="explainable-recommendation-v1",
            latency_ms=latency,
            prompt_text=f"{request.user_skills} -> {request.career_goal}",
            completion_text=str(pipeline_result.model_dump()),
            metadata={"recommendation_count": len(pipeline_result.recommendations)}
        )
    except Exception as e:
        logger.error(f"[RecommendationService] Pipeline failed: {e}. Executing AI Gateway Fallback...")
        payload = request.model_dump()
        return ai_gateway.route_request(
            service_name="recommendation_generation",
            method_name="generate_recommendations",
            payload=payload,
            schema_class=RecommendationResponse,
            user_skills=request.user_skills,
            career_goal=request.career_goal,
            learning_style=request.preferred_learning_style or "hands-on"
        )
