from typing import List, Dict, Any

class RecommendationRanker:
    """
    Ranks recommendations using weighted multi-factor scoring.
    """

    @classmethod
    def rank_recommendations(cls, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        for item in items:
            score = 0.0

            # Priority Weight
            p = item.get("priority", "medium")
            if p == "high":
                score += 40.0
            elif p == "medium":
                score += 25.0
            else:
                score += 10.0

            # Impact Weight
            readiness_boost = item.get("estimated_readiness_improvement", 5.0)
            score += min(readiness_boost * 1.5, 30.0)

            # ROI Weight
            roi = item.get("learning_roi", "High")
            if roi == "Exceptional":
                score += 20.0
            elif roi == "Very High":
                score += 15.0
            else:
                score += 10.0

            # Confidence
            conf = item.get("confidence", 0.90)
            score += conf * 10.0

            item["weighted_rank_score"] = round(score, 2)

        # Sort descending by weighted_rank_score
        return sorted(items, key=lambda x: x.get("weighted_rank_score", 0.0), reverse=True)
