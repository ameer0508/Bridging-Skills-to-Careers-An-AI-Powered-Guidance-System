from app.gateway.ai_gateway import ai_gateway
from app.schemas.resume import ParsedResumeResponse
from app.schemas.ai_response import UnifiedAIResponse

def parse_resume_text(text: str) -> ParsedResumeResponse:
    """
    Passes raw resume text to AI Gateway and returns ParsedResumeResponse for backward compatibility.
    """
    response: UnifiedAIResponse = ai_gateway.route_request(
        service_name="resume_parsing",
        method_name="parse_resume_text",
        payload=text,
        schema_class=ParsedResumeResponse
    )
    if not response.success or not response.response:
        raise ValueError(f"AI Resume Parsing failed: {response.errors}")
    
    return ParsedResumeResponse.model_validate(response.response)
