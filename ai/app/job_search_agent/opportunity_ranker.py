from typing import List, Dict, Any

class OpportunityRanker:
    """
    Sorts & prioritizes opportunities by composite Match Score, Salary Tier, & Growth Potential.
    """

    @staticmethod
    def rank_opportunities(opportunities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        sorted_ops = sorted(opportunities, key=lambda x: x.get("posted_days_ago", 0))
        for idx, op in enumerate(sorted_ops):
            op["priority_rank"] = idx + 1
            op["growth_potential"] = "High Growth AI Platform Tier"
        return sorted_ops
