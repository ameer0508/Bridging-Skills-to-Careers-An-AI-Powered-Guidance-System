from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# Unified Gateway Data Schemas
class UnifiedJob(BaseModel):
    id: str
    title: str
    company: str
    location: str
    workplace_type: str = "Remote"  # Remote, Hybrid, Onsite
    salary_range: str = "$120,000 - $160,000"
    skills_required: List[str] = Field(default_factory=list)
    match_score: float = 95.0
    provider: str
    url: str

class UnifiedSalary(BaseModel):
    job_title: str
    min_salary_usd: float
    max_salary_usd: float
    median_salary_usd: float
    experience_level: str
    location: str
    confidence: float = 0.98

class UnifiedCourse(BaseModel):
    id: str
    title: str
    provider: str
    duration_hours: float
    cost_usd: float
    is_free: bool
    rating: float
    skills_taught: List[str] = Field(default_factory=list)
    url: str

class UnifiedCertification(BaseModel):
    id: str
    name: str
    provider: str
    level: str
    exam_code: str
    exam_cost_usd: float
    salary_boost_usd: float
    url: str

class UnifiedMarketTrend(BaseModel):
    skill_name: str
    category: str
    growth_yoy: float
    demand_score: float
    hiring_velocity: str

# Base Provider Interface
class BaseExternalProvider(ABC):
    @property
    @abstractmethod
    def provider_id(self) -> str:
        pass

    @property
    @abstractmethod
    def domain(self) -> str:
        """One of: job, salary, course, certification, market_trend"""
        pass

    @abstractmethod
    def fetch_data(self, query_params: Dict[str, Any]) -> List[Any]:
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        pass
