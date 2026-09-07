from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from app.core.logging import logger
from app.services.chat_service import generate_chat_via_ai

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

class ChatRequest(BaseModel):
    prompt: str = Field(..., description="The context-augmented prompt for the AI Architect")

@router.post("")
async def generate_chat_response(request: ChatRequest):
    logger.info("Received request for AI Architect chat generation via AI Gateway")
    ai_resp = generate_chat_via_ai(request.prompt)
    resp_dict = ai_resp.model_dump()
    
    # Ensure error field format for backward compatibility
    if not ai_resp.success:
        resp_dict["error"] = "; ".join(ai_resp.errors)
    else:
        resp_dict["error"] = None

    return JSONResponse(status_code=200 if ai_resp.success else 500, content=resp_dict)
