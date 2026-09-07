from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Career Matching
class CareerMatchRequest(BaseModel):
    user_skills: List[str]
    target_role: str
    experience_years: float = 0.0

class CareerMatchResponse(BaseModel):
    match_score: float = Field(..., ge=0.0, le=100.0)
    matched_skills: List[str]
    missing_skills: List[str]
    summary: str

# Readiness Score
class ReadinessRequest(BaseModel):
    user_skills: List[str]
    required_skills: List[str]
    role_title: str

class ReadinessResponse(BaseModel):
    readiness_score: float = Field(..., ge=0.0, le=100.0)
    readiness_level: str  # High, Moderate, Developing
    strengths: List[str]
    gaps: List[str]
    action_items: List[str]

# Recommendation Engine
class RecommendationRequest(BaseModel):
    user_skills: List[str]
    career_goal: str
    preferred_learning_style: Optional[str] = "hands-on"
    completed_learning: Optional[List[str]] = Field(default_factory=list)
    experience_years: Optional[float] = 0.0

class RecommendationItem(BaseModel):
    title: str
    type: str  # course, project, certification, skill, technology, interview_prep, resume_improvement, portfolio_improvement, github_improvement, networking
    reason: str
    priority: str  # high, medium, low
    why_recommended: Optional[str] = None
    supporting_evidence: List[str] = Field(default_factory=list)
    skills_improved: List[str] = Field(default_factory=list)
    career_impact: Optional[str] = None
    estimated_readiness_improvement: float = Field(default=10.0)
    estimated_match_score_improvement: float = Field(default=12.0)
    estimated_learning_time: Optional[str] = "1-2 weeks"
    difficulty: Optional[str] = "Intermediate"
    industry_demand: Optional[str] = "High"
    learning_roi: Optional[str] = "High"
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem]

# Roadmap Generator
class RoadmapRequest(BaseModel):
    current_level: str
    target_role: str
    target_months: int = 6
    user_skills: Optional[List[str]] = Field(default_factory=list)
    completed_milestones: Optional[List[str]] = Field(default_factory=list)
    weekly_hours_available: Optional[int] = 15

class RoadmapPhase(BaseModel):
    phase: int
    title: str
    duration_weeks: int
    focus_skills: List[str]
    milestones: List[str]
    why_included: Optional[str] = None
    prerequisites: Optional[List[str]] = Field(default_factory=list)
    career_benefit: Optional[str] = None
    estimated_effort: Optional[str] = None
    expected_outcome: Optional[str] = None
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)

class RoadmapResponse(BaseModel):
    title: str
    estimated_months: int
    estimated_weeks: Optional[int] = None
    estimated_readiness_date: Optional[str] = None
    phases: List[RoadmapPhase]

# Analytics Engine
class AnalyticsRequest(BaseModel):
    user_id: str
    skills_trend: List[Dict[str, Any]] = Field(default_factory=list)
    target_role: Optional[str] = "Senior AI Engineer"
    current_level: Optional[str] = "mid"
    user_skills: Optional[List[str]] = Field(default_factory=list)
    simulation_scenario: Optional[Dict[str, Any]] = None

class AnalyticsInsight(BaseModel):
    metric: str
    finding: str
    impact: str  # positive, neutral, attention_needed
    actionable_tip: str

class AnalyticsResponse(BaseModel):
    overall_skill_growth_rate: float
    market_relevance_index: float
    insights: List[AnalyticsInsight]
    readiness_forecast: Optional[Dict[str, Any]] = None
    salary_prediction: Optional[Dict[str, Any]] = None
    market_forecast: Optional[Dict[str, Any]] = None
    career_progression: Optional[Dict[str, Any]] = None
    interview_success: Optional[Dict[str, Any]] = None
    simulation_results: Optional[Dict[str, Any]] = None
    executive_insights: Optional[Dict[str, Any]] = None

# Resume Intelligence
class ResumeIntelligenceRequest(BaseModel):
    resume_text: str
    target_role: Optional[str] = None

class ResumeIntelligenceResponse(BaseModel):
    overall_quality_score: float = Field(..., ge=0.0, le=100.0)
    ats_compatibility_score: float = Field(..., ge=0.0, le=100.0)
    formatting_critique: List[str]
    content_improvements: List[str]
    keyword_optimizations: List[str]
