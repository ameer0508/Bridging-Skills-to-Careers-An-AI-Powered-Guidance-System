from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from app.core.logging import logger
from app.gateway.ai_gateway import ai_gateway
from app.providers.local_adapter import BUSY_MARKER
from app.services.chat_service import generate_chat_via_ai

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

MOCK_PROVIDER = "mock"


class ChatRequest(BaseModel):
    prompt: str = Field(
        ..., min_length=1, max_length=60000, description="The context-augmented prompt for the AI Architect"
    )


def _unavailable() -> JSONResponse:
    # Internal error details stay in the server log; the caller only needs to know it can retry later
    return JSONResponse(
        status_code=503,
        content={"success": False, "code": "AI_UNAVAILABLE", "error": "AI chat is unavailable."},
    )


def _busy() -> JSONResponse:
    # The local model is at capacity: refused at once, nothing generated, cached or invented
    return JSONResponse(
        status_code=503,
        headers={"Retry-After": "60"},
        content={"success": False, "code": "AI_BUSY", "error": "AI chat is busy; try again shortly."},
    )


@router.post("")
def generate_chat_response(request: ChatRequest):
    """
    Generates a chat reply using a real AI provider.

    The development mock provider is never allowed to answer here: its canned text would be
    stored and shown to the user as if it were an AI reply. Without a real provider, or when the
    provider fails, this returns 503 and the backend shows its own clearly labelled fallback.

    Synchronous on purpose: FastAPI runs it in a worker thread, so a slow local model does not
    hold up the event loop (other requests and the health check).
    """
    try:
        chain = ai_gateway.get_provider_chain()
    except Exception:
        chain = []
    real_providers = [p for p in chain if p.provider_name != MOCK_PROVIDER]
    if not real_providers:
        # X11: recorded, so "chat unavailable" shows up in observability with the reasons
        ai_gateway.record_unavailable("chat_architect", "only_test_provider" if chain else "no_allowed_provider", chain)
        return _unavailable()

    try:
        ai_resp = generate_chat_via_ai(request.prompt)
    except Exception as exc:
        logger.warning(f"[Chat] AI provider call failed: {exc}")
        return _unavailable()

    text = ai_resp.response if isinstance(ai_resp.response, str) else None
    if not ai_resp.success or ai_resp.provider == MOCK_PROVIDER or not text or not text.strip():
        if not ai_resp.success:
            logger.warning(f"[Chat] AI provider returned an error: {'; '.join(ai_resp.errors)}")
            if any(BUSY_MARKER in e for e in ai_resp.errors):
                return _busy()
        return _unavailable()

    # Only fields that were actually measured or reported are returned: no confidence figure
    return {
        "success": True,
        "data": text,
        "response": text,
        "provider": ai_resp.provider,
        "model": ai_resp.model,
        "latency": ai_resp.latency,
        "usage": ai_resp.usage.model_dump(),
        "fallback_used": bool(ai_resp.metadata.get("fallback_used")),
        "error": None,
    }
