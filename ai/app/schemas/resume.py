from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional

class ExtractedEntity(BaseModel):
    value: str
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Estimate reported by an AI model when one produced this value. None when no confidence was measured, which is always the case for the rule-based parser.")
    source: Optional[str] = "resume_body"
    transformer_model: Optional[str] = None
    extraction_method: Optional[str] = "semantic-ner"

class PersonalInfo(BaseModel):
    fullName: Optional[ExtractedEntity] = None
    email: Optional[ExtractedEntity] = None
    phone: Optional[ExtractedEntity] = None
    linkedin: Optional[ExtractedEntity] = None
    github: Optional[ExtractedEntity] = None
    portfolio: Optional[ExtractedEntity] = None

class Education(BaseModel):
    institution: Optional[ExtractedEntity] = None
    degree: Optional[ExtractedEntity] = None
    branch: Optional[ExtractedEntity] = None
    startYear: Optional[ExtractedEntity] = None
    endYear: Optional[ExtractedEntity] = None
    gpa: Optional[ExtractedEntity] = None

class Experience(BaseModel):
    company: Optional[ExtractedEntity] = None
    role: Optional[ExtractedEntity] = None
    duration: Optional[ExtractedEntity] = None
    responsibilities: List[ExtractedEntity] = Field(default_factory=list)

class Project(BaseModel):
    name: Optional[ExtractedEntity] = None
    description: Optional[ExtractedEntity] = None
    technologies: List[ExtractedEntity] = Field(default_factory=list)
    contributions: List[ExtractedEntity] = Field(default_factory=list)

class Skill(BaseModel):
    name: str
    category: str = Field(description="e.g., Programming Languages, Frameworks, Databases, Cloud, DevOps, AI/ML, Cybersecurity, Tools")
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Estimate reported by an AI model when one produced this value. None when no confidence was measured, which is always the case for the rule-based parser.")

class ParsedResumeResponse(BaseModel):
    personalInfo: PersonalInfo
    education: List[Education] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)
    certifications: List[ExtractedEntity] = Field(default_factory=list)
    achievements: List[ExtractedEntity] = Field(default_factory=list)
    languages: List[ExtractedEntity] = Field(default_factory=list)
    interests: List[ExtractedEntity] = Field(default_factory=list)
