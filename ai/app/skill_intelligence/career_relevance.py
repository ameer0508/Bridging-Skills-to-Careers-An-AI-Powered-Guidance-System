from typing import Dict, Any
from app.skill_intelligence.demand_mapper import DemandMapper
from app.skill_intelligence.emerging_skill_detector import EmergingSkillDetector

class CareerRelevanceEngine:
    """
    Calculates career relevance score, recommendation priority, learning priority, and growth potential.
    """

    @classmethod
    def calculate_relevance(cls, canonical_name: str, category: str) -> Dict[str, Any]:
        demand = DemandMapper.map_demand(canonical_name)
        is_emerging = EmergingSkillDetector.is_emerging(canonical_name)

        if is_emerging or demand["demand_level"] == "Very High":
            score = 92.5
            rec_priority = "High"
            learn_priority = "High"
            growth = "Very High"
        else:
            score = 78.0
            rec_priority = "Medium"
            learn_priority = "Medium"
            growth = "High"

        return {
            "score": score,
            "industry_demand": demand["demand_level"],
            "recommendation_priority": rec_priority,
            "learning_priority": learn_priority,
            "growth_potential": growth,
            "demand_details": demand
        }
