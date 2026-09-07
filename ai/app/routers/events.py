from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.event_platform.event_bus import event_bus_instance

router = APIRouter(prefix="/api/v1/events", tags=["Event Platform"])

@router.get("/telemetry")
async def get_event_platform_telemetry():
    """
    Returns real-time Event Bus telemetry metrics, health status, and DLQ depth.
    """
    return {
        "success": True,
        "data": event_bus_instance.get_telemetry()
    }

@router.get("/dlq")
async def get_dead_letter_queue():
    """
    Returns dead-letter queue records for unprocessable events.
    """
    return {
        "success": True,
        "data": event_bus_instance.dlq.list_dlq_events()
    }

@router.post("/replay/{correlation_id}")
async def replay_event_correlation(correlation_id: str):
    """
    Replays historical events matching correlation_id across all registered subscribers.
    """
    try:
        replayed_count = event_bus_instance.replay_correlation(correlation_id)
        return {"success": True, "replayed_count": replayed_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
