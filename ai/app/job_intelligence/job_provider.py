"""
Job Provider Module for SkillBridge Job Intelligence Engine.
Defines unified JobListing schema and BaseJobProvider abstract base class.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class JobListing(BaseModel):
    """Unified normalized JobListing schema for all job providers."""
    id: str
    job_title: str
    company: str
    location: str = "Remote"
    remote_status: str = "Remote"  # Remote, Hybrid, On-site
    employment_type: str = "Full-time"  # Full-time, Part-time, Contract, Internship
    experience_level: str = "Mid-Level"  # Junior, Mid-Level, Senior, Lead
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = "USD"
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    description: str = ""
    benefits: List[str] = Field(default_factory=list)
    posting_date: str = ""
    apply_url: str = ""
    provider: str = "mock"
    demand_score: float = Field(default=85.0, ge=0.0, le=100.0)
    semantic_skills: List[str] = Field(default_factory=list)
    compatibility_score: float = Field(default=88.0, ge=0.0, le=100.0)


class BaseJobProvider(ABC):
    """Abstract base class for external job provider adapters."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the job provider."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Checks if the provider API key or service is available."""
        pass

    @abstractmethod
    def fetch_jobs(
        self,
        query: str = "",
        skills: List[str] = None,
        location: str = "",
        remote_only: bool = False,
        limit: int = 20
    ) -> List[JobListing]:
        """Fetches raw jobs and returns normalized JobListing instances."""
        pass
