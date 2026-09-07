"""
Job Filter Module for SkillBridge Job Intelligence Engine.
Filters job listings by keyword, skills, location, remote status, salary, and experience level.
"""

from typing import List, Optional
from app.job_intelligence.job_provider import JobListing


class JobFilter:
    """
    Applies multi-criterion filtering to job listings.
    """

    def filter_jobs(
        self,
        jobs: List[JobListing],
        keyword: Optional[str] = None,
        skills: Optional[List[str]] = None,
        location: Optional[str] = None,
        remote_only: bool = False,
        min_salary: Optional[float] = None,
        experience_level: Optional[str] = None
    ) -> List[JobListing]:
        """
        Filters listings matching criteria.
        """
        filtered = jobs

        if keyword and keyword.strip():
            k_lower = keyword.strip().lower()
            filtered = [
                j for j in filtered
                if k_lower in j.job_title.lower()
                or k_lower in j.company.lower()
                or k_lower in j.description.lower()
            ]

        if remote_only:
            filtered = [j for j in filtered if j.remote_status.lower() == "remote"]

        if location and location.strip():
            loc_lower = location.strip().lower()
            filtered = [j for j in filtered if loc_lower in j.location.lower() or j.remote_status.lower() == "remote"]

        if min_salary is not None:
            filtered = [
                j for j in filtered
                if j.salary_min is None or j.salary_min >= min_salary
            ]

        if experience_level and experience_level.strip():
            exp_lower = experience_level.strip().lower()
            filtered = [j for j in filtered if exp_lower in j.experience_level.lower()]

        if skills:
            skills_set = set(s.lower().strip() for s in skills)
            filtered = [
                j for j in filtered
                if any(s.lower() in skills_set for s in j.required_skills) or not j.required_skills
            ]

        return filtered
