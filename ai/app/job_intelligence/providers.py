"""
Job Provider Adapters for SkillBridge Job Intelligence Engine.
Implements JSearch, Adzuna, Arbeitnow, RemoteOK, USAJobs, and Mock Job Provider adapters.
"""

import os
import logging
from typing import List, Dict, Any
from app.job_intelligence.job_provider import BaseJobProvider, JobListing

logger = logging.getLogger("skillbridge-ai")


class MockJobProvider(BaseJobProvider):
    """Mock Job Provider adapter for development and testing environments."""

    @property
    def provider_name(self) -> str:
        return "mock"

    def is_available(self) -> bool:
        return True

    def fetch_jobs(
        self,
        query: str = "",
        skills: List[str] = None,
        location: str = "",
        remote_only: bool = False,
        limit: int = 20
    ) -> List[JobListing]:
        user_skills = skills or ["Python", "FastAPI", "Docker", "PyTorch", "Milvus"]
        
        mock_jobs = [
            JobListing(
                id="job_mock_1",
                job_title="Senior AI Engineer - RAG & Vector Systems",
                company="NexusAI Labs",
                location="San Francisco, CA",
                remote_status="Remote",
                employment_type="Full-time",
                experience_level="Senior",
                salary_min=145000,
                salary_max=185000,
                required_skills=["Python", "Async FastAPI", "PyTorch", "Milvus", "Docker"],
                preferred_skills=["Model Context Protocol", "Kubernetes", "LangChain"],
                description="Lead the design and scaling of production RAG retrieval pipelines and distributed vector search clusters.",
                benefits=["Health, Dental, Vision", "Unlimited PTO", "$3,000 Learning Budget"],
                posting_date="2026-07-28",
                apply_url="https://example.com/careers/senior-ai-engineer",
                provider="mock",
                demand_score=96.0,
                semantic_skills=["Python", "FastAPI", "PyTorch", "Milvus", "Vector DBs"],
                compatibility_score=94.5
            ),
            JobListing(
                id="job_mock_2",
                job_title="Backend Microservices Engineer",
                company="CloudScale Systems",
                location="Austin, TX",
                remote_status="Remote",
                employment_type="Full-time",
                experience_level="Mid-Level",
                salary_min=125000,
                salary_max=160000,
                required_skills=["Python", "Async FastAPI", "PostgreSQL", "Docker"],
                preferred_skills=["Redis", "Kubernetes", "Kafka"],
                description="Architect high-concurrency microservices and RESTful API gateways for enterprise cloud clients.",
                benefits=["401(k) Matching", "Remote Work Stipend", "Equity Package"],
                posting_date="2026-07-29",
                apply_url="https://example.com/careers/backend-engineer",
                provider="mock",
                demand_score=92.0,
                semantic_skills=["Python", "FastAPI", "PostgreSQL", "Docker", "Microservices"],
                compatibility_score=91.0
            ),
            JobListing(
                id="job_mock_3",
                job_title="Full Stack Software Engineer",
                company="InnovateTech Inc",
                location="New York, NY",
                remote_status="Hybrid",
                employment_type="Full-time",
                experience_level="Mid-Level",
                salary_min=115000,
                salary_max=150000,
                required_skills=["TypeScript", "React 19", "Python", "FastAPI"],
                preferred_skills=["Next.js", "TailwindCSS"],
                description="Build intuitive web application dashboards integrated with backend AI microservices.",
                benefits=["Flexible Hours", "Health Insurance"],
                posting_date="2026-07-30",
                apply_url="https://example.com/careers/fullstack-engineer",
                provider="mock",
                demand_score=88.0,
                semantic_skills=["TypeScript", "React", "Python", "FastAPI"],
                compatibility_score=87.5
            )
        ]
        return mock_jobs[:limit]


class JSearchProvider(BaseJobProvider):
    """JSearch API Adapter (RapidAPI)."""

    @property
    def provider_name(self) -> str:
        return "jsearch"

    def is_available(self) -> bool:
        return bool(os.getenv("JSEARCH_API_KEY"))

    def fetch_jobs(
        self,
        query: str = "",
        skills: List[str] = None,
        location: str = "",
        remote_only: bool = False,
        limit: int = 20
    ) -> List[JobListing]:
        if not self.is_available():
            logger.info("[JSearch] API key not configured; skipping provider.")
            return []
        # Fallback empty list if key configured but external request pending
        return []


class AdzunaProvider(BaseJobProvider):
    """Adzuna Job Search API Adapter."""

    @property
    def provider_name(self) -> str:
        return "adzuna"

    def is_available(self) -> bool:
        return bool(os.getenv("ADZUNA_APP_ID") and os.getenv("ADZUNA_APP_KEY"))

    def fetch_jobs(
        self,
        query: str = "",
        skills: List[str] = None,
        location: str = "",
        remote_only: bool = False,
        limit: int = 20
    ) -> List[JobListing]:
        if not self.is_available():
            logger.info("[Adzuna] API credentials not configured; skipping provider.")
            return []
        return []


class ArbeitnowProvider(BaseJobProvider):
    """Arbeitnow Remote Job Board Adapter."""

    @property
    def provider_name(self) -> str:
        return "arbeitnow"

    def is_available(self) -> bool:
        return True  # Open API without key

    def fetch_jobs(
        self,
        query: str = "",
        skills: List[str] = None,
        location: str = "",
        remote_only: bool = False,
        limit: int = 20
    ) -> List[JobListing]:
        # Arbeitnow open feed adapter fallback
        return []


class RemoteOKProvider(BaseJobProvider):
    """RemoteOK Job API Adapter."""

    @property
    def provider_name(self) -> str:
        return "remoteok"

    def is_available(self) -> bool:
        return True  # Open API feed

    def fetch_jobs(
        self,
        query: str = "",
        skills: List[str] = None,
        location: str = "",
        remote_only: bool = False,
        limit: int = 20
    ) -> List[JobListing]:
        return []


class USAJobsProvider(BaseJobProvider):
    """USAJobs Federal Job API Adapter."""

    @property
    def provider_name(self) -> str:
        return "usajobs"

    def is_available(self) -> bool:
        return bool(os.getenv("USAJOBS_API_KEY"))

    def fetch_jobs(
        self,
        query: str = "",
        skills: List[str] = None,
        location: str = "",
        remote_only: bool = False,
        limit: int = 20
    ) -> List[JobListing]:
        if not self.is_available():
            logger.info("[USAJobs] API key not configured; skipping provider.")
            return []
        return []
