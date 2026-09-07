from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RawSkillList(BaseModel):
    skills: List[str] = Field(..., description="A list of raw skill strings to be normalized.")
    context_text: Optional[str] = Field(default="", description="Optional context text (e.g. resume or job description) for evidence scoring.")

class SkillRelationship(BaseModel):
    related_skill: str = Field(..., description="The canonical name of the related skill.")
    type: str = Field(..., description="The type of relationship. Must be one of: 'parent', 'sub', 'related', 'prerequisite'.")

class SkillProficiency(BaseModel):
    level: str = Field(default="Intermediate", description="Beginner, Intermediate, Advanced, Expert")
    confidence: float = Field(default=0.90, ge=0.0, le=1.0)
    evidence_score: float = Field(default=0.85, ge=0.0, le=1.0)

class SkillCareerRelevance(BaseModel):
    score: float = Field(default=85.0, ge=0.0, le=100.0)
    industry_demand: str = Field(default="High")
    recommendation_priority: str = Field(default="High")
    learning_priority: str = Field(default="Medium")
    growth_potential: str = Field(default="Very High")

class NormalizedSkill(BaseModel):
    raw_name: str = Field(..., description="The original raw skill string that was provided.")
    canonical_name: str = Field(..., description="The properly capitalized, standard canonical name of the skill (e.g., 'Node.js', 'C++').")
    category: str = Field(..., description="The category this skill belongs to (e.g., 'Programming Languages', 'Frameworks', 'Cloud', 'Databases', 'Tools', 'Soft Skills').")
    aliases: List[str] = Field(default_factory=list, description="Common aliases or abbreviations for this skill.")
    relationships: List[SkillRelationship] = Field(default_factory=list, description="Important relationships this skill has with other skills.")
    proficiency: Optional[SkillProficiency] = None
    career_relevance: Optional[SkillCareerRelevance] = None
    is_emerging: bool = False
    transferable_skills: List[str] = Field(default_factory=list)
    evidence: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    source: str = Field(default="semantic_skill_engine")

class NormalizedSkillResponse(BaseModel):
    normalized_skills: List[NormalizedSkill] = Field(..., description="The list of normalized skills.")
    skill_clusters: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)
    total_skills_analyzed: int = 0
    emerging_skills_detected: int = 0
