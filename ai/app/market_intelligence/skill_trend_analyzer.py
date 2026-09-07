from typing import List, Dict, Any
from app.market_intelligence.trend_provider import MarketTrendPoint

class SkillTrendAnalyzer:
    """
    Analyzes skill and technology trends across domains (AI Frameworks, DevOps, Cloud, Languages).
    """

    @staticmethod
    def categorize_trends(points: List[MarketTrendPoint]) -> Dict[str, List[Dict[str, Any]]]:
        categorized: Dict[str, List[Dict[str, Any]]] = {}
        for p in points:
            category = p.category or "General"
            categorized.setdefault(category, []).append({
                "name": p.name,
                "demand_score": p.demand_score,
                "growth_rate_yoy": p.growth_rate_yoy,
                "learning_priority": p.learning_priority,
                "maturity_stage": p.maturity_stage,
                "provider": p.provider
            })
        return categorized

    @staticmethod
    def get_top_in_demand(points: List[MarketTrendPoint], top_n: int = 5) -> List[Dict[str, Any]]:
        sorted_points = sorted(points, key=lambda x: x.demand_score, reverse=True)
        return [
            {
                "name": p.name,
                "category": p.category,
                "demand_score": p.demand_score,
                "growth_rate_yoy": p.growth_rate_yoy,
                "priority": p.learning_priority
            }
            for p in sorted_points[:top_n]
        ]
