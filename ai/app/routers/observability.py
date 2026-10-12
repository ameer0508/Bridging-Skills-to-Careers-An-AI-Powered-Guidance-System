"""
AI observability endpoints (X11). Internal only: the backend serves them to administrators.
They expose decisions, categories and timings recorded by the gateway, never request content.
"""
from fastapi import APIRouter, Query

from app.cost_policy import runtime_policy
from app.gateway.ai_gateway import ai_gateway
from app.observability import audit_log

router = APIRouter(prefix="/api/v1/observability", tags=["Observability"])


@router.get("/summary")
async def summary(window_hours: float = Query(24, gt=0, le=24 * 90)):
    return {"success": True, "data": audit_log.summary(window_hours)}


@router.get("/events")
async def events(limit: int = Query(100, ge=1, le=500), window_hours: float = Query(24, gt=0, le=24 * 90)):
    return {"success": True, "data": {"events": audit_log.events(limit=limit, window_hours=window_hours), "retentionDays": audit_log.retention_days}}


@router.get("/providers")
async def providers():
    """Each registered provider: whether the zero-cost policy allows it, and why not, for both kinds of data."""
    rows = []
    for name, provider in ai_gateway.providers.items():
        personal = runtime_policy.check(name, True)
        general = runtime_policy.check(name, False)
        rows.append({
            "provider": name,
            "status": runtime_policy.status(name).value,
            "available": bool(provider.is_available()),
            "personalData": {"allowed": personal.allowed, "reason": personal.reason.value if personal.reason else None},
            "nonPersonalData": {"allowed": general.allowed, "reason": general.reason.value if general.reason else None},
            "quotaRemaining": runtime_policy.ledger.remaining(name),
        })
    return {"success": True, "data": {"providers": rows}}
