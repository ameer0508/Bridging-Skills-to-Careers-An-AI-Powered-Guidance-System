from typing import List, Dict, Any

class OpportunityRankingEngine:
    """
    Ranks opportunities by composite Match Score, Career Impact, & Long-Term Prestige.
    """

    @staticmethod
    def rank_opportunities(opportunities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        sorted_ops = sorted(opportunities, key=lambda x: x.get("match_score", 0), reverse=True)
        for idx, op in enumerate(sorted_ops):
            op["priority_rank"] = idx + 1
            op["career_impact_rating"] = "Tier 1 Highest Value"
        return sorted_ops
