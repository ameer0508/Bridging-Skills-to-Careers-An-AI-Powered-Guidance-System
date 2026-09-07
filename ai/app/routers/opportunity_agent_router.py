from fastapi import APIRouter, Query, HTTPException
from app.opportunity_agent.opportunity_agent import opportunity_agent_instance

router = APIRouter(prefix="/api/v1/opportunity-agent", tags=["Autonomous Opportunity Discovery Agent"])

@router.get("/discover/{user_id}")
async def run_opportunity_discovery_cycle(user_id: str):
    """
    Runs an autonomous opportunity discovery cycle ranking jobs, fellowships, hackathons, & startup accelerators.
    """
    try:
        data = opportunity_agent_instance.run_discovery_cycle(user_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
