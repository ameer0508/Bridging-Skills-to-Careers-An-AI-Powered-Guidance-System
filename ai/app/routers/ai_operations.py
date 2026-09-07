from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.ai_operations.dashboard_api import ai_operations_instance

router = APIRouter(prefix="/api/v1/ai-operations", tags=["AI Operations & Observability"])

@router.get("/dashboard")
async def get_ai_operations_dashboard():
    """
    Returns real-time AI Observability summary: metrics, health, alerts, SLOs, and incidents.
    """
    return {
        "success": True,
        "data": ai_operations_instance.get_dashboard_summary()
    }

@router.get("/feature-flags")
async def get_feature_flags():
    """
    Returns active feature flag configurations & canary rollout status.
    """
    return {
        "success": True,
        "flags": ai_operations_instance.feature_flag_mgr._flags
    }

@router.post("/feature-flags/{flag_key}")
async def toggle_feature_flag(flag_key: str, enabled: bool):
    """
    Toggles canary feature flag or emergency kill switch.
    """
    ai_operations_instance.feature_flag_mgr.set_flag(flag_key, enabled)
    ai_operations_instance.audit_logger.log_action("TOGGLE_FEATURE_FLAG", "AdminUser", {"flag": flag_key, "enabled": enabled})
    return {"success": True, "flag": flag_key, "enabled": enabled}
