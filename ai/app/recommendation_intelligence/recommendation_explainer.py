from typing import Dict, Any

class RecommendationExplainer:
    """
    Constructs transparent, human-readable explanation cards.
    """

    @classmethod
    def create_explanation_card(cls, rec_item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "title": rec_item.get("title"),
            "category_type": rec_item.get("type"),
            "priority": rec_item.get("priority"),
            "why_recommended": rec_item.get("why_recommended"),
            "supporting_evidence": rec_item.get("supporting_evidence", []),
            "skills_improved": rec_item.get("skills_improved", []),
            "career_impact": rec_item.get("career_impact", {}),
            "difficulty": rec_item.get("difficulty"),
            "learning_roi": rec_item.get("learning_roi"),
            "confidence": rec_item.get("confidence", 0.95)
        }
