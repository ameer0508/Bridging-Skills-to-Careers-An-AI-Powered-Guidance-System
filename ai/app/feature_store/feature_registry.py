from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class FeatureDomain(str, Enum):
    RESUME = "resume"
    SKILL = "skill"
    EMBEDDING = "embedding"
    MATCH = "match"
    READINESS = "readiness"
    RECOMMENDATION = "recommendation"
    ROADMAP = "roadmap"
    MARKET = "market"
    SALARY = "salary font"
    COURSE = "course"
    CERTIFICATION = "certification"
    PROGRESS = "progress"

class FeatureDefinition(BaseModel):
    feature_name: str
    domain: FeatureDomain
    version: str = "v1.0"
    data_type: str = "float"
    description: str
    default_value: Any = None
