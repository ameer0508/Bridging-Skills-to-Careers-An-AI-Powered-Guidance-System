import time
import logging
from typing import Dict, Any, List, Optional
from app.linkedin_intelligence.linkedin_client import LinkedInClient
from app.linkedin_intelligence.profile_parser import ProfileParser
from app.linkedin_intelligence.experience_analyzer import ExperienceAnalyzer
from app.linkedin_intelligence.education_analyzer import EducationAnalyzer
from app.linkedin_intelligence.endorsement_analyzer import EndorsementAnalyzer
from app.linkedin_intelligence.recommendation_analyzer import RecommendationAnalyzer
from app.linkedin_intelligence.network_analyzer import NetworkAnalyzer
from app.linkedin_intelligence.profile_strength import ProfileStrengthCalculator
from app.linkedin_intelligence.career_progression import CareerProgressionEngine
from app.linkedin_intelligence.branding_engine import BrandingEngine
from app.linkedin_intelligence.cache_manager import LinkedInCacheManager
from app.linkedin_intelligence.sync_scheduler import LinkedInSyncScheduler

logger = logging.getLogger("skillbridge-linkedin")

class LinkedInIntelligenceEngine:
    """
    Central LinkedIn Intelligence Engine Facade for SkillBridge.
    Evaluates professional identity, recruiter appeal, career progression, and branding optimization.
    """

    def __init__(self):
        self.client = LinkedInClient()
        self.cache = LinkedInCacheManager()
        self.scheduler = LinkedInSyncScheduler()

    def analyze_profile(self, profile_id: str) -> Dict[str, Any]:
        start = time.time()
        cached = self.cache.get(profile_id)
        if cached:
            return cached

        raw_data = self.client.fetch_profile_data(profile_id)
        parsed = ProfileParser.parse_profile(raw_data)

        exp_res = ExperienceAnalyzer.analyze_experiences(raw_data.get("experiences", []))
        edu_res = EducationAnalyzer.analyze_education(raw_data.get("educations", []))
        endorse_res = EndorsementAnalyzer.analyze_endorsements(raw_data.get("skills", []))
        rec_res = RecommendationAnalyzer.analyze_recommendations(raw_data.get("recommendations", []))
        net_res = NetworkAnalyzer.analyze_network(raw_data.get("connections", 0))

        strength_res = ProfileStrengthCalculator.calculate_strength(parsed, exp_res, net_res)
        prog_res = CareerProgressionEngine.evaluate_progression(raw_data.get("experiences", []))
        brand_res = BrandingEngine.generate_branding_recommendations(parsed["headline"], parsed["summary"])

        result = {
            "profile_id": profile_id,
            "parsed_summary": parsed,
            "experience_analysis": exp_res,
            "education_analysis": edu_res,
            "endorsements": endorse_res,
            "recommendations": rec_res,
            "network": net_res,
            "profile_strength": strength_res,
            "career_progression": prog_res,
            "branding_recommendations": brand_res,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

        self.cache.set(profile_id, result)
        self.scheduler.record_sync(profile_id)
        return result

# Global Singleton Instance
linkedin_intelligence_instance = LinkedInIntelligenceEngine()
