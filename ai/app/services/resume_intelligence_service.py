from app.gateway.ai_gateway import ai_gateway
from app.schemas.modules import ResumeIntelligenceRequest, ResumeIntelligenceResponse
from app.schemas.ai_response import UnifiedAIResponse

def analyze_resume_intelligence_via_ai(request: ResumeIntelligenceRequest) -> UnifiedAIResponse:
    payload = request.model_dump()
    return ai_gateway.route_request(
        service_name="resume_intelligence",
        method_name="analyze_resume_intelligence",
        payload=payload,
        schema_class=ResumeIntelligenceResponse,
        resume_text=request.resume_text,
        target_role=request.target_role
    )
