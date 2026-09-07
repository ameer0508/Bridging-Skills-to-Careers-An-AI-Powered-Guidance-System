from typing import List, Dict, Any

class LearningPriorityEngine:
    """
    Calculates recommendation sequence priority and learning prerequisites.
    """

    @classmethod
    def evaluate_priority(cls, item_type: str, is_missing_core_skill: bool, is_emerging: bool) -> str:
        if is_missing_core_skill or is_emerging or item_type in ["project", "resume_improvement"]:
            return "high"
        elif item_type in ["course", "certification", "portfolio_improvement"]:
            return "medium"
        else:
            return "low"

    @classmethod
    def sequence_recommendations(cls, recommendations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # Order high -> medium -> low
        priority_order = {"high": 1, "medium": 2, "low": 3}
        return sorted(recommendations, key=lambda x: priority_order.get(x.get("priority", "medium"), 2))
