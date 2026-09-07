"""
Job Normalizer Module for SkillBridge Job Intelligence Engine.
Normalizes raw job payloads into unified JobListing schema and deduplicates listings.
"""

from typing import List, Dict, Set, Any
from app.job_intelligence.job_provider import JobListing


class JobNormalizer:
    """
    Normalizes skill names, locations, employment types, and deduplicates job items across providers.
    """

    def deduplicate_jobs(self, jobs: List[JobListing]) -> List[JobListing]:
        """
        Deduplicates listings using (job_title.lower(), company.lower()) key tuple.
        """
        seen: Set[str] = set()
        unique_jobs: List[JobListing] = []

        for job in jobs:
            key = f"{job.job_title.strip().lower()}||{job.company.strip().lower()}"
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)

        return unique_jobs

    def normalize_job(self, job: JobListing) -> JobListing:
        """
        Normalizes skill formatting, location casing, and remote status.
        """
        norm_skills = [s.strip() for s in job.required_skills if s.strip()]
        norm_pref = [s.strip() for s in job.preferred_skills if s.strip()]
        
        job.required_skills = norm_skills
        job.preferred_skills = norm_pref

        # Remote status normalization
        desc_lower = job.description.lower()
        if "remote" in job.location.lower() or "remote" in desc_lower:
            job.remote_status = "Remote"
        elif "hybrid" in desc_lower:
            job.remote_status = "Hybrid"

        return job

    def normalize_and_deduplicate(self, jobs: List[JobListing]) -> List[JobListing]:
        """
        Applies normalization and deduplication in sequence.
        """
        normalized = [self.normalize_job(j) for j in jobs]
        return self.deduplicate_jobs(normalized)
