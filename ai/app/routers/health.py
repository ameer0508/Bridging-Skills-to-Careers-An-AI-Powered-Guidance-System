from fastapi import APIRouter
from app.gateway.ai_gateway import ai_gateway
from app.config.ai_config import ai_config

router = APIRouter(prefix="/api/v1/health", tags=["Health"])

@router.get("")
async def health_check():
    providers_status = {}
    for name, provider in ai_gateway.providers.items():
        providers_status[name] = {
            "available": provider.is_available(),
            "default_model": provider.default_model
        }

    return {
        "status": "healthy",
        "service": "SkillBridge AI Intelligence Layer",
        "primary_provider": ai_config.primary_provider,
        "mock_enabled": ai_config.enable_mock_provider,
        "caching_active": True,
        "providers": providers_status
    }
