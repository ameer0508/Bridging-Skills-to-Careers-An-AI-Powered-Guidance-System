"""
Provider Manager Module for SkillBridge Job Intelligence Engine.
Manages adapter registration, fallback execution, and provider health checks.
"""

import logging
from typing import Dict, List, Any, Optional
from app.job_intelligence.job_provider import BaseJobProvider, JobListing
from app.job_intelligence.providers import (
    MockJobProvider, JSearchProvider, AdzunaProvider,
    ArbeitnowProvider, RemoteOKProvider, USAJobsProvider
)

logger = logging.getLogger("skillbridge-ai")


class ProviderManager:
    """
    Orchestrates job provider adapters and aggregates listings across available sources.
    """

    def __init__(self):
        self.providers: Dict[str, BaseJobProvider] = {}
        self._register_default_providers()

    def _register_default_providers(self):
        self.providers["mock"] = MockJobProvider()
        self.providers["jsearch"] = JSearchProvider()
        self.providers["adzuna"] = AdzunaProvider()
        self.providers["arbeitnow"] = ArbeitnowProvider()
        self.providers["remoteok"] = RemoteOKProvider()
        self.providers["usajobs"] = USAJobsProvider()
        logger.info(f"[Job Intelligence Engine] Registered provider adapters: {list(self.providers.keys())}")

    def get_available_providers(self) -> List[str]:
        """Returns list of currently active & available provider names."""
        return [name for name, p in self.providers.items() if p.is_available()]

    def fetch_all_jobs(
        self,
        query: str = "",
        skills: List[str] = None,
        location: str = "",
        remote_only: bool = False,
        limit: int = 20
    ) -> List[JobListing]:
        """
        Collects job listings from all available providers.
        """
        all_jobs: List[JobListing] = []
        available = self.get_available_providers()

        for name in available:
            try:
                provider = self.providers[name]
                jobs = provider.fetch_jobs(
                    query=query,
                    skills=skills,
                    location=location,
                    remote_only=remote_only,
                    limit=limit
                )
                all_jobs.extend(jobs)
            except Exception as e:
                logger.warning(f"[ProviderManager] Error fetching jobs from provider '{name}': {e}")

        # If no jobs returned from external providers, fallback to Mock Provider
        if not all_jobs and "mock" in self.providers:
            all_jobs = self.providers["mock"].fetch_jobs(
                query=query,
                skills=skills,
                location=location,
                remote_only=remote_only,
                limit=limit
            )

        return all_jobs
