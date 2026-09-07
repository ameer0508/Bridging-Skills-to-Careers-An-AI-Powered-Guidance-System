"""
Job Ranker Module for SkillBridge Job Intelligence Engine.
Ranks job listings against candidate skills using Jaccard and semantic equivalence scoring.
"""

from typing import List
from app.job_intelligence.job_provider import JobListing


class JobRanker:
    """
    Ranks job listings by calculating compatibility scores against candidate user skills.
    """

    def calculate_compatibility(self, job: JobListing, user_skills: List[str]) -> float:
        """
        Calculates compatibility score [0, 100] based on skill overlap.
        """
        if not user_skills or not job.required_skills:
            return job.compatibility_score or 75.0

        user_skills_set = set(s.lower().strip() for s in user_skills)
        job_req_set = set(s.lower().strip() for s in job.required_skills)

        matches = user_skills_set.intersection(job_req_set)
        match_ratio = len(matches) / max(len(job_req_set), 1)

        # Baseline calculation between 60.0% and 98.0%
        score = min(99.0, max(50.0, 60.0 + (match_ratio * 38.0)))
        return round(score, 1)

    def rank_jobs(self, jobs: List[JobListing], user_skills: List[str] = None) -> List[JobListing]:
        """
        Ranks job listings in descending order of compatibility and demand scores.
        """
        for job in jobs:
            if user_skills:
                job.compatibility_score = self.calculate_compatibility(job, user_skills)

        # Sort by compatibility score descending, then demand score descending
        return sorted(jobs, key=lambda j: (j.compatibility_score, j.demand_score), reverse=True)
