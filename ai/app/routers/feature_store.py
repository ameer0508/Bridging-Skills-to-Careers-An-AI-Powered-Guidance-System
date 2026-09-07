from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
from app.feature_store.feature_store import feature_store_instance

router = APIRouter(prefix="/api/v1/feature-store", tags=["AI Feature Store"])

@router.get("/online/{entity_id}")
async def get_online_features(
    entity_id: str,
    features: List[str] = Query(..., description="Feature names list"),
):
    """
    Serves low-latency online features for target entity ID.
    """
    try:
        data = feature_store_instance.get_online_features(entity_id, features)
        return {"success": True, "entity_id": entity_id, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/materialize/{entity_id}")
async def materialize_entity_features(entity_id: str, raw_payload: Dict[str, Any]):
    """
    Runs feature pipeline to materialize & dual-write online/offline features.
    """
    try:
        res = feature_store_instance.materialize_entity(entity_id, raw_payload)
        return {"success": True, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/telemetry")
async def get_feature_store_telemetry():
    """
    Returns feature catalog size, cache hit ratios, and telemetry metrics.
    """
    return {
        "success": True,
        "data": feature_store_instance.get_telemetry()
    }
