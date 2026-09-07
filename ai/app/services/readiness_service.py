from app.gateway.ai_gateway import ai_gateway
from app.schemas.modules import ReadinessRequest, ReadinessResponse
from app.schemas.ai_response import UnifiedAIResponse

def calculate_readiness_via_ai(request: ReadinessRequest) -> UnifiedAIResponse:
    payload = request.model_dump()
    return ai_gateway.route_request(
        service_name="readiness_scoring",
        method_name="calculate_readiness",
        payload=payload,
        schema_class=ReadinessResponse,
        user_skills=request.user_skills,
        required_skills=request.required_skills,
        role_title=request.role_title
    )
