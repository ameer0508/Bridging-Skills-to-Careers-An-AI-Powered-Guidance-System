from app.gateway.ai_gateway import ai_gateway
from app.schemas.ai_response import UnifiedAIResponse

def generate_chat_via_ai(prompt: str) -> UnifiedAIResponse:
    return ai_gateway.route_request(
        service_name="chat_architect",
        method_name="generate_content",
        payload=prompt,
        prompt=prompt
    )
