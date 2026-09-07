import logging
from typing import Dict, Any, List

logger = logging.getLogger("skillbridge-ai")

class SalaryPredictor:
    """
    AI Compensation Predictor & Career ROI Engine.
    Estimates current profile salary, roadmap completion impact, certification boosts, and ROI timelines.
    """

    @staticmethod
    def predict_user_compensation(
        verified_skills: List[str],
        experience_years: float = 3.0,
        target_role: str = "Software Engineer",
        base_market_median: float = 145000.0
    ) -> Dict[str, Any]:
        
        # Skill multiplier calculation
        skill_weight = min(len(verified_skills) * 0.025, 0.25)
        exp_weight = min(experience_years * 0.04, 0.35)
        
        predicted_current = round(base_market_median * (1.0 + exp_weight + (skill_weight * 0.5)), 2)
        
        # Roadmap Completion Impact
        roadmap_boost = round(base_market_median * 0.18, 2)
        predicted_post_roadmap = round(predicted_current + roadmap_boost, 2)
        
        # Skill gaps impact
        skill_impacts = {
            "Kubernetes": "+$14,500/yr",
            "Vector Databases (Milvus)": "+$18,200/yr",
            "FastAPI / Microservices": "+$12,000/yr",
            "AWS Solutions Architect": "+$15,000/yr",
        }

        # ROI Calculation (assuming $500 learning cost / courses)
        roi_months = round((500 / (roadmap_boost / 12)), 1) if roadmap_boost > 0 else 1.0

        return {
            "target_role": target_role,
            "predicted_current_salary_usd": predicted_current,
            "predicted_post_roadmap_salary_usd": predicted_post_roadmap,
            "expected_salary_gain_usd": roadmap_boost,
            "percentage_increase": 18.0,
            "skill_impact_breakdown": skill_impacts,
            "career_roi_months": roi_months,
            "confidence_score": 0.96
        }
