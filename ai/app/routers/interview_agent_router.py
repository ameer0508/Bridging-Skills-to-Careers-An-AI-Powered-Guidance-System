from fastapi import APIRouter, Query, HTTPException
from app.interview_agent.interview_agent import interview_agent_instance

router = APIRouter(prefix="/api/v1/interview-agent", tags=["Autonomous Interview Preparation Agent"])

@router.get("/prep/{user_id}")
async def run_interview_prep_cycle(
    user_id: str,
    company: str = Query("OpenScale AI Systems", description="Target company for interview prep"),
    target_role: str = Query("Principal AI Infrastructure Architect", description="Target role title")
):
    """
    Runs an autonomous interview preparation cycle generating questions, evaluating answers, & calculating readiness scores.
    """
    try:
        data = interview_agent_instance.run_interview_prep_cycle(user_id, company=company, target_role=target_role)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
