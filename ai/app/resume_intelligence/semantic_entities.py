from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class SemanticExtractedEntity(BaseModel):
    value: str
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    source: str = Field(default="resume_body")
    transformer_model: str = Field(default="transformer-ner-v1")
    extraction_method: str = Field(default="semantic-ner")

class SemanticPersonalInfo(BaseModel):
    fullName: Optional[SemanticExtractedEntity] = None
    email: Optional[SemanticExtractedEntity] = None
    phone: Optional[SemanticExtractedEntity] = None
    location: Optional[SemanticExtractedEntity] = None
    linkedin: Optional[SemanticExtractedEntity] = None
    github: Optional[SemanticExtractedEntity] = None
    portfolio: Optional[SemanticExtractedEntity] = None

class SemanticEducation(BaseModel):
    institution: Optional[SemanticExtractedEntity] = None
    degree: Optional[SemanticExtractedEntity] = None
    branch: Optional[SemanticExtractedEntity] = None
    startYear: Optional[SemanticExtractedEntity] = None
    endYear: Optional[SemanticExtractedEntity] = None
    gpa: Optional[SemanticExtractedEntity] = None

class SemanticExperience(BaseModel):
    company: Optional[SemanticExtractedEntity] = None
    role: Optional[SemanticExtractedEntity] = None
    duration: Optional[SemanticExtractedEntity] = None
    location: Optional[SemanticExtractedEntity] = None
    responsibilities: List[SemanticExtractedEntity] = Field(default_factory=list)

class SemanticProject(BaseModel):
    name: Optional[SemanticExtractedEntity] = None
    description: Optional[SemanticExtractedEntity] = None
    technologies: List[SemanticExtractedEntity] = Field(default_factory=list)
    contributions: List[SemanticExtractedEntity] = Field(default_factory=list)

class SemanticSkill(BaseModel):
    name: str
    category: str = Field(description="e.g., Programming Languages, Frameworks, Databases, Cloud, DevOps, AI/ML, Cybersecurity, Tools, Soft Skills")
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    source: str = Field(default="skill_engine")
    transformer_model: str = Field(default="transformer-skill-v1")
    extraction_method: str = Field(default="taxonomy-mapping")
    parent_domains: List[str] = Field(default_factory=list)

class SemanticCertification(BaseModel):
    name: SemanticExtractedEntity
    issuer: Optional[SemanticExtractedEntity] = None
    year: Optional[SemanticExtractedEntity] = None

class SemanticLanguage(BaseModel):
    language: SemanticExtractedEntity
    proficiency: Optional[SemanticExtractedEntity] = None

class ResumeProfile(BaseModel):
    personalInfo: SemanticPersonalInfo = Field(default_factory=SemanticPersonalInfo)
    education: List[SemanticEducation] = Field(default_factory=list)
    experience: List[SemanticExperience] = Field(default_factory=list)
    projects: List[SemanticProject] = Field(default_factory=list)
    skills: List[SemanticSkill] = Field(default_factory=list)
    certifications: List[SemanticCertification] = Field(default_factory=list)
    achievements: List[SemanticExtractedEntity] = Field(default_factory=list)
    languages: List[SemanticLanguage] = Field(default_factory=list)
    interests: List[SemanticExtractedEntity] = Field(default_factory=list)
    detected_layout: Dict[str, Any] = Field(default_factory=dict)
    detected_sections: List[str] = Field(default_factory=list)
