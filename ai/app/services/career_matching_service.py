from typing import List
from app.gateway.ai_gateway import ai_gateway
from app.schemas.modules import CareerMatchRequest, CareerMatchResponse
from app.schemas.ai_response import UnifiedAIResponse

def match_career_via_ai(request: CareerMatchRequest) -> UnifiedAIResponse:
    payload = request.model_dump()
    return ai_gateway.route_request(
        service_name="career_matching",
        method_name="match_career",
        payload=payload,
        schema_class=CareerMatchResponse,
        user_skills=request.user_skills,
        target_role=request.target_role,
        experience_years=request.experience_years
    )
