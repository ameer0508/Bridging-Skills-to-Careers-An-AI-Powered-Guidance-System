from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any
from app.external_gateway.gateway import gateway_instance

router = APIRouter(prefix="/api/v1/external-gateway", tags=["External Intelligence Gateway"])

@router.get("/query/{domain}")
async def query_external_gateway(
    domain: str,
    q: Optional[str] = Query(None, description="Query parameter string"),
):
    """
    Unified Single Gateway Endpoint routing requests to Jobs, Salary, Course, Certification, & Market Trend Providers.
    """
    try:
        query_params = {"q": q} if q else {}
        result = gateway_instance.fetch_domain_data(domain=domain, query_params=query_params)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def get_gateway_health():
    """
    Returns real-time gateway health, latency metrics, and provider registration registry.
    """
    return {
        "success": True,
        "registry": gateway_instance.registry.list_all_registered(),
        "metrics": gateway_instance.metrics.get_metrics(),
        "cache": gateway_instance.cache.get_stats(),
        "sync": gateway_instance.sync_manager.get_sync_status(),
        "health": gateway_instance.health_monitor.get_health_status()
    }
