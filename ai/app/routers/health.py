import hmac
from fastapi import APIRouter, Request
from app.gateway.ai_gateway import ai_gateway
from app.config.ai_config import ai_config
from app.core.config import settings
from app.core.security import INTERNAL_KEY_HEADER

router = APIRouter(prefix="/api/v1/health", tags=["Health"])


@router.get("")
async def health_check(request: Request):
    """
    Liveness probe. Unauthenticated callers (load balancers, container health checks) only
    learn that the service is up. Provider configuration details are returned solely to
    callers presenting the internal service key.
    """
    minimal = {"status": "healthy", "service": "SkillBridge AI Intelligence Layer"}

    presented = request.headers.get(INTERNAL_KEY_HEADER, "")
    authorized = bool(presented) and hmac.compare_digest(
        presented.encode("utf-8"), settings.INTERNAL_SERVICE_KEY.encode("utf-8")
    )
    if not authorized:
        return minimal

    providers_status = {}
    for name, provider in ai_gateway.providers.items():
        providers_status[name] = {
            "available": provider.is_available(),
            "default_model": provider.default_model
        }

    return {
        **minimal,
        "primary_provider": ai_config.primary_provider,
        "mock_enabled": ai_config.enable_mock_provider,
        "providers": providers_status
    }
