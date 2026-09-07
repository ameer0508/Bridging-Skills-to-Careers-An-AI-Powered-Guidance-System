import time
import logging
from typing import Dict, Any, List, Optional
from app.professional_brand.identity_analyzer import IdentityAnalyzer
from app.professional_brand.consistency_engine import ConsistencyEngine
from app.professional_brand.communication_analyzer import CommunicationAnalyzer
from app.professional_brand.storytelling_engine import StorytellingEngine
from app.professional_brand.keyword_optimizer import KeywordOptimizer
from app.professional_brand.recruiter_visibility import RecruiterVisibilityCalculator
from app.professional_brand.ats_visibility import ATSVisibilityCalculator
from app.professional_brand.credibility_engine import CredibilityEngine
from app.professional_brand.reputation_engine import ReputationEngine
from app.professional_brand.improvement_engine import ImprovementEngine
from app.professional_brand.cache_manager import BrandCacheManager
from app.professional_brand.sync_scheduler import BrandSyncScheduler

logger = logging.getLogger("skillbridge-brand")

class ProfessionalBrandEngine:
    """
    Central Professional Brand Intelligence Engine Facade for SkillBridge.
    Evaluates complete professional identity, recruiter visibility, ATS optimization, credibility, & brand consistency.
    """

    def __init__(self):
        self.cache = BrandCacheManager()
        self.scheduler = BrandSyncScheduler()

    def analyze_brand(self, user_id: str, profile_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        start = time.time()
        cached = self.cache.get(user_id)
        if cached:
            return cached

        if profile_data is None:
            profile_data = {"user_id": user_id, "name": "Alex Mercer"}

        ident_res = IdentityAnalyzer.analyze_identity(profile_data)
        consist_res = ConsistencyEngine.verify_consistency(profile_data)
        comm_res = CommunicationAnalyzer.analyze_communication(profile_data)
        story_res = StorytellingEngine.analyze_storytelling(profile_data)
        kw_res = KeywordOptimizer.optimize_keywords(profile_data)
        rec_res = RecruiterVisibilityCalculator.calculate_visibility(profile_data)
        ats_res = ATSVisibilityCalculator.calculate_ats_score(profile_data)
        cred_res = CredibilityEngine.evaluate_credibility(profile_data)
        rep_res = ReputationEngine.evaluate_reputation(profile_data)
        imp_res = ImprovementEngine.generate_improvements(profile_data)

        # Composite Professional Brand Score (0-100)
        overall_brand_score = min(98.8, round((
            ident_res["positioning_clarity_score"] * 0.2 +
            consist_res["cross_platform_consistency_score"] * 0.2 +
            rec_res["recruiter_visibility_score"] * 0.2 +
            cred_res["professional_credibility_score"] * 0.2 +
            kw_res["keyword_optimization_score"] * 0.2
        ), 1))

        result = {
            "user_id": user_id,
            "identity": ident_res,
            "consistency": consist_res,
            "communication": comm_res,
            "storytelling": story_res,
            "keywords": kw_res,
            "recruiter_visibility": rec_res,
            "ats_compatibility": ats_res,
            "credibility": cred_res,
            "reputation": rep_res,
            "improvements": imp_res,
            "brand_score": {
                "overall_brand_score": overall_brand_score,
                "tier": "Top 1% Enterprise Thought Leader",
                "hiring_appeal": "High Executive Demand"
            },
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

        self.cache.set(user_id, result)
        self.scheduler.record_sync(user_id)
        return result

# Global Singleton Instance
professional_brand_instance = ProfessionalBrandEngine()
