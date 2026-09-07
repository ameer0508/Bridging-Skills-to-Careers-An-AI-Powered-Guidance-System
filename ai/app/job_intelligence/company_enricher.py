"""
Company Enricher Module for SkillBridge Job Intelligence Engine.
Enriches company industry classification, domain tags, and employer reputation metrics.
"""

from typing import List, Dict, Any
from app.job_intelligence.job_provider import JobListing


class CompanyEnricher:
    """
    Enriches company information on JobListing items.
    """

    COMPANY_DOMAINS: Dict[str, Dict[str, Any]] = {
        "nexusai labs": {"industry": "Artificial Intelligence", "domain": "AI Research", "tier": "Top Tier Startup"},
        "cloudscale systems": {"industry": "Cloud Infrastructure", "domain": "DevOps", "tier": "Enterprise Cloud"},
        "innovatetech inc": {"industry": "Software & Web", "domain": "Full Stack", "tier": "Tech Innovator"}
    }

    def enrich_job(self, job: JobListing) -> JobListing:
        """
        Enriches job listing with company industry and domain information.
        """
        comp_key = job.company.strip().lower()
        if comp_key in self.COMPANY_DOMAINS:
            meta = self.COMPANY_DOMAINS[comp_key]
            if meta["domain"] not in job.preferred_skills:
                job.preferred_skills.append(f"Domain: {meta['domain']}")

        # Ensure semantic skills include main title entities
        title_lower = job.job_title.lower()
        if "ai" in title_lower or "rag" in title_lower:
            if "AI Systems" not in job.semantic_skills:
                job.semantic_skills.append("AI Systems")
        if "backend" in title_lower or "api" in title_lower:
            if "Backend Architecture" not in job.semantic_skills:
                job.semantic_skills.append("Backend Architecture")

        return job

    def enrich_jobs(self, jobs: List[JobListing]) -> List[JobListing]:
        """
        Enriches list of job listings.
        """
        return [self.enrich_job(j) for j in jobs]
