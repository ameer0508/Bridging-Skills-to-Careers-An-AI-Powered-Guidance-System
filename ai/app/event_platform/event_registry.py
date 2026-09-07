import uuid
import time
from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class EventType(str, Enum):
    USER_CREATED = "UserCreated"
    RESUME_UPLOADED = "ResumeUploaded"
    RESUME_PARSED = "ResumeParsed"
    SKILLS_EXTRACTED = "SkillsExtracted"
    CAREER_MATCHED = "CareerMatched"
    RECOMMENDATIONS_GENERATED = "RecommendationsGenerated"
    ROADMAP_GENERATED = "RoadmapGenerated"
    ROADMAP_UPDATED = "RoadmapUpdated"
    PROGRESS_UPDATED = "ProgressUpdated"
    JOB_DATA_UPDATED = "JobDataUpdated"
    SALARY_DATA_UPDATED = "SalaryDataUpdated"
    MARKET_TREND_UPDATED = "MarketTrendUpdated"
    COURSE_CATALOG_UPDATED = "CourseCatalogUpdated"
    CERTIFICATION_CATALOG_UPDATED = "CertificationCatalogUpdated"
    KNOWLEDGE_GRAPH_UPDATED = "KnowledgeGraphUpdated"
    PREDICTION_GENERATED = "PredictionGenerated"

class DomainEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: EventType
    producer: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    correlation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float = Field(default_factory=time.time)
