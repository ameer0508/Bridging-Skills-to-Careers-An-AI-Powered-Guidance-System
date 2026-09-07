from fastapi import APIRouter, Query, HTTPException
from app.job_search_agent.job_agent import job_agent_instance

router = APIRouter(prefix="/api/v1/job-agent", tags=["Autonomous Job Search Agent"])

@router.get("/run/{user_id}")
async def run_job_search_agent_cycle(
    user_id: str,
    target_role: str = Query("Principal AI Infrastructure Architect", description="Target job title to search & rank")
):
    """
    Runs an autonomous job search cycle discovering, ranking, tracking, & explaining top employment opportunities.
    """
    try:
        data = job_agent_instance.run_agent_cycle(user_id, target_role=target_role)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
