from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.knowledge_graph.graph_engine import knowledge_graph_instance

router = APIRouter(prefix="/api/v1/knowledge-graph", tags=["Knowledge Graph"])

@router.get("/neighborhood/{node_id}")
async def get_node_neighborhood(node_id: str):
    """
    Returns immediate 1-hop semantic graph neighborhood for target entity node.
    """
    try:
        result = knowledge_graph_instance.query_neighborhood(node_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shortest-path")
async def get_shortest_path(
    start_id: str = Query(..., description="Starting entity node ID"),
    target_id: str = Query(..., description="Target entity node ID"),
):
    """
    Computes shortest learning or career transition path between start and target graph nodes.
    """
    try:
        result = knowledge_graph_instance.find_shortest_learning_path(start_id, target_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/telemetry")
async def get_graph_telemetry():
    """
    Returns topology metrics (nodes, edges, density, average degree) and schema validation status.
    """
    return {
        "success": True,
        "data": knowledge_graph_instance.get_telemetry()
    }
