from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.schemas.modules import RecommendationRequest
from app.services.recommendation_service import generate_recommendations_via_ai

router = APIRouter(prefix="/api/v1/recommendations", tags=["Recommendations"])

@router.post("/generate")
@router.post("/explain")
async def generate_recommendations(request: RecommendationRequest):
    """
    Generates explainable, personalized recommendations across 10 categories
    (Courses, Projects, Certifications, Skills, Technologies, Interview Prep, Resume, Portfolio, GitHub, Networking).
    Returns standard UnifiedAIResponse envelope while maintaining 100% backward compatibility.
    """
    ai_resp = generate_recommendations_via_ai(request)
    resp_dict = ai_resp.model_dump()
    
    # Merge recommendations directly onto root level for backward compatibility
    if isinstance(ai_resp.response, dict) and "recommendations" in ai_resp.response:
        resp_dict["recommendations"] = ai_resp.response["recommendations"]

    return JSONResponse(status_code=200 if ai_resp.success else 500, content=resp_dict)
