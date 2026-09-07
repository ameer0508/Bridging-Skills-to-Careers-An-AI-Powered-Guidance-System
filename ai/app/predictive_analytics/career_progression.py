"""
Career Progression Module for Predictive Analytics & Career Intelligence Engine.
Models career advancement trajectories and promotion readiness.
"""

from typing import List, Dict, Any


class CareerProgressionModel:
    """
    Predicts career advancement stages and readiness for senior leadership / architect roles.
    """

    STAGES: List[str] = [
        "Junior Engineer",
        "Mid-Level Engineer",
        "Senior Engineer",
        "Lead Architect",
        "Principal Architect"
    ]

    def predict_progression(
        self,
        current_level: str = "mid",
        verified_skills_count: int = 18,
        readiness_score: float = 85.0
    ) -> Dict[str, Any]:
        """
        Computes current stage index and estimated timeline to next promotion level.
        """
        lvl_norm = current_level.lower()

        if "senior" in lvl_norm or "lead" in lvl_norm:
            current_stage = "Senior Engineer"
            next_stage = "Lead Architect"
        elif "beginner" in lvl_norm or "entry" in lvl_norm or "junior" in lvl_norm:
            current_stage = "Junior Engineer"
            next_stage = "Mid-Level Engineer"
        else:
            current_stage = "Mid-Level Engineer"
            next_stage = "Senior Engineer"

        promotion_readiness = min(99.0, (readiness_score * 0.7) + (verified_skills_count * 1.5))
        months_to_promotion = max(2, round((100.0 - promotion_readiness) * 0.15))

        return {
            "current_stage": current_stage,
            "next_stage": next_stage,
            "promotion_readiness_score": round(promotion_readiness, 1),
            "estimated_months_to_next_stage": months_to_promotion,
            "confidence": 0.95
        }
