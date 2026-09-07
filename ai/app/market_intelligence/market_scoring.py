from typing import Dict, Any

class MarketScoringEngine:
    """
    Computes composite market scores: Saturation, Competition, and Opportunity Index.
    """

    @staticmethod
    def compute_composite_scores(demand: float, growth: float, saturation: float, competition: float) -> Dict[str, float]:
        # Opportunity Index formula: weighted high demand & growth, penalized by high saturation
        opportunity = (demand * 0.45) + (growth * 0.35) + ((100 - saturation) * 0.20)
        return {
            "demand_score": round(demand, 1),
            "growth_score": round(growth, 1),
            "saturation_score": round(saturation, 1),
            "competition_score": round(competition, 1),
            "opportunity_index": round(min(100.0, max(0.0, opportunity)), 1)
        }
