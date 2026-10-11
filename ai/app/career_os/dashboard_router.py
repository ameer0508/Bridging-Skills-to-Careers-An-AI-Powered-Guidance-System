# NOTE: this module has no live data source. It returns built-in illustrative sample data,
# labelled as such in every response. It is not used by the product's user workflows.
ILLUSTRATIVE = "illustrative_sample"
from fastapi import APIRouter, HTTPException
from app.career_os.dashboard_service import career_os_dashboard_service_instance

router = APIRouter(prefix="/api/v1/career-os", tags=["CareerOS Unified API Layer"])

@router.get("/dashboard/{user_id}")
async def get_career_os_dashboard(user_id: str):
    """
    Returns unified CareerOS Command Center payload aggregating all 7 AI Agents & Intelligence Modules.
    """
    try:
        data = career_os_dashboard_service_instance.get_dashboard_payload(user_id)
        return {"success": True, "data_origin": ILLUSTRATIVE, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
