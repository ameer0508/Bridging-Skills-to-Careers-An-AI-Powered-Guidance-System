from fastapi import APIRouter, Query, HTTPException
from app.agent_orchestrator.orchestrator import multi_agent_orchestrator_instance

router = APIRouter(prefix="/api/v1/orchestrator", tags=["Multi-Agent Orchestrator"])

@router.post("/execute/{user_id}")
async def execute_multi_agent_workflow(
    user_id: str,
    goal: str = Query("Become Principal AI Infrastructure Architect", description="Target career goal to plan & execute"),
    target_company: str = Query("OpenScale AI Systems", description="Target company")
):
    """
    Executes a multi-agent DAG workflow coordinating all 7 Autonomous SkillBridge AI Agents.
    """
    try:
        data = multi_agent_orchestrator_instance.execute_career_goal(user_id, goal=goal, target_company=target_company)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
