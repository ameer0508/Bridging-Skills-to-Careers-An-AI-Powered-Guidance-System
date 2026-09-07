from fastapi import APIRouter, Query, HTTPException
from app.career_agent.planning_agent import career_agent_instance

router = APIRouter(prefix="/api/v1/agent", tags=["Career Planning Agent"])

@router.get("/plan/{user_id}")
async def get_agent_career_plan(
    user_id: str,
    adapt: bool = Query(False, description="Trigger autonomous market adaptation recalculation")
):
    """
    Runs the autonomous Career Planning Agent to reason, adapt, plan, & decompose strategy into actionable tasks.
    """
    try:
        data = career_agent_instance.run_agent_session(user_id, trigger_adaptation=adapt)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
