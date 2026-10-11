# NOTE: this module has no live data source. It returns built-in illustrative sample data,
# labelled as such in every response. It is not used by the product's user workflows.
ILLUSTRATIVE = "illustrative_sample"
from fastapi import APIRouter, HTTPException
from app.professional_graph.graph_engine import unified_graph_instance

router = APIRouter(prefix="/api/v1/graph", tags=["Unified Professional Graph"])

@router.get("/twin/{user_id}")
async def get_user_digital_twin(user_id: str):
    """
    Returns the complete Professional Digital Twin graph connecting skills, projects, repositories, & verified evidence.
    """
    try:
        data = unified_graph_instance.get_digital_twin(user_id)
        return {"success": True, "data_origin": ILLUSTRATIVE, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
