from pydantic import BaseModel, Field
from typing import List, Optional

class RoleBenchmarkData(BaseModel):
    target_role: str
    match_score: int = Field(..., description="Estimated role compatibility score between 0 and 100")
    market_demand_rating: str = Field(..., description="Market demand rating, e.g., 'Very High', 'High', 'Moderate'")
    prerequisite_skills: List[str] = Field(default_factory=list, description="Core industry prerequisites for this role")
    recommended_seniority: str = Field(..., description="Recommended career tier, e.g., 'Mid-Level', 'Senior'")

class SkillGapBreakdown(BaseModel):
    verified_skills: List[str] = Field(default_factory=list, description="Skills verified in candidate profile")
    missing_skills: List[str] = Field(default_factory=list, description="Skills absent from profile but required by role")
    critical_gaps: List[str] = Field(default_factory=list, description="High-severity prerequisite gaps to prioritize")
    gap_percentage: int = Field(..., description="Overall gap percentage between 0 and 100")

class CurriculumMilestone(BaseModel):
    title: str = Field(..., description="Actionable learning module title")
    description: str = Field(..., description="Core concept or practical exercise")
    estimated_weeks: int = Field(..., description="Estimated effort in weeks")
    deliverable: str = Field(..., description="Tangible project, repository, or certification output")

class CurriculumPhase(BaseModel):
    phase_number: int = Field(..., description="Sequential phase number (1, 2, 3)")
    title: str = Field(..., description="Phase title e.g. 'Foundational Vector Engineering'")
    objective: str = Field(..., description="Core milestone target of the phase")
    milestones: List[CurriculumMilestone] = Field(default_factory=list, description="List of concrete milestones")

class MarketIntelligenceSnapshot(BaseModel):
    estimated_salary_range: str = Field(..., description="Market compensation band e.g. '$135,000 - $175,000'")
    hiring_intensity: str = Field(..., description="Hiring index, e.g. 'Strong', 'Accelerating'")
    top_employers: List[str] = Field(default_factory=list, description="Notable companies recruiting for this track")
    remote_work_availability: str = Field(..., description="e.g. 'High (65% Remote / Hybrid)'")

class StrategicDirective(BaseModel):
    action_key: str = Field(..., description="Action identifier e.g. 'bridge_rag_gap'")
    title: str = Field(..., description="Human-readable high-impact action title")
    rationale: str = Field(..., description="Contextual AI reasoning behind this directive")
    recommended_workspace_route: str = Field(..., description="Platform route e.g. '/roadmap', '/skills'")
    priority: str = Field(..., description="Directive urgency: 'Highest', 'High', 'Medium'")

class AutonomousCareerIntelligenceReport(BaseModel):
    candidate_target_role: str
    executive_summary: str = Field(..., description="Executive narrative assessing current standing and trajectory")
    benchmark: RoleBenchmarkData
    gap_analysis: SkillGapBreakdown
    remediation_roadmap: List[CurriculumPhase] = Field(default_factory=list)
    market_intelligence: MarketIntelligenceSnapshot
    next_best_action: StrategicDirective
    agent_confidence_score: float = Field(..., description="Agent confidence score from 0.0 to 1.0")
