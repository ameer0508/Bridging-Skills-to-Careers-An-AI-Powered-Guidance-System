from pydantic import BaseModel, Field
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from app.career_agent.planning_agent import career_agent_instance
from app.career_agent.antigravity_agent import career_intelligence_agent
from app.career_agent.antigravity_schemas import AutonomousCareerIntelligenceReport

router = APIRouter(prefix="/api/v1/agent", tags=["Career Planning Agent"])

class AutonomousGuidanceRequest(BaseModel):
    target_role: str = Field(..., description="Target career role or aspiration", json_schema_extra={"example": "AI Engineer"})
    candidate_skills: List[str] = Field(default_factory=list, description="Currently verified candidate skills", json_schema_extra={"example": ["Python", "FastAPI", "Docker"]})
    timeline_months: int = Field(6, ge=1, le=24, description="Remediation timeline in months", json_schema_extra={"example": 6})

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

@router.post(
    "/autonomous-guidance",
    response_model=AutonomousCareerIntelligenceReport,
    summary="Generate Autonomous Career Intelligence Report via Google Antigravity Agent"
)
async def generate_autonomous_career_guidance(request: AutonomousGuidanceRequest):
    """
    Orchestrates Google Antigravity SDK autonomous agent tools to benchmark role competencies,
    conduct gap audits, synthesize milestone curriculum roadmaps, and extract compensation radars.
    """
    try:
        report = await career_intelligence_agent.run_analysis(
            target_role=request.target_role,
            candidate_skills=request.candidate_skills,
            timeline_months=request.timeline_months
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Autonomous Agent failure: {str(e)}")

