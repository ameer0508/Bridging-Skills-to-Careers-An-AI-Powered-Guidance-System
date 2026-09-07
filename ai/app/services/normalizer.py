from app.gateway.ai_gateway import ai_gateway
from app.schemas.skill import NormalizedSkillResponse
from app.schemas.ai_response import UnifiedAIResponse

def normalize_skills_via_llm(raw_skills: list[str]) -> NormalizedSkillResponse:
    """
    Takes a list of raw skill strings and routes through AI Gateway to normalize them.
    Returns NormalizedSkillResponse for backward compatibility.
    """
    if not raw_skills:
        return NormalizedSkillResponse(normalized_skills=[])

    response: UnifiedAIResponse = ai_gateway.route_request(
        service_name="skill_normalization",
        method_name="normalize_skills",
        payload=raw_skills,
        schema_class=NormalizedSkillResponse
    )

    if not response.success or not response.response:
        raise ValueError(f"AI Skill Normalization failed: {response.errors}")

    return NormalizedSkillResponse.model_validate(response.response)
