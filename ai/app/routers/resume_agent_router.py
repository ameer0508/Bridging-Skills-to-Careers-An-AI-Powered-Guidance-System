# NOTE: this module has no live data source. It returns built-in illustrative sample data,
# labelled as such in every response. It is not used by the product's user workflows.
ILLUSTRATIVE = "illustrative_sample"
from fastapi import APIRouter, Query, HTTPException
from app.resume_agent.resume_agent import resume_agent_instance

router = APIRouter(prefix="/api/v1/resume-agent", tags=["Autonomous Resume Optimization Agent"])

@router.get("/optimize/{user_id}")
async def optimize_resume_cycle(
    user_id: str,
    target_role: str = Query("Principal AI Infrastructure Architect", description="Target role to tailor & optimize resume for")
):
    """
    Runs an autonomous resume optimization cycle tailoring summary, keywords, bullets, & validating claim evidence.
    """
    try:
        data = resume_agent_instance.run_optimization_cycle(user_id, target_role=target_role)
        return {"success": True, "data_origin": ILLUSTRATIVE, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
