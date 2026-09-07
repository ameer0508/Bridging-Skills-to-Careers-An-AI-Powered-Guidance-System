from typing import List, Dict, Any
from app.market_intelligence.trend_provider import MarketTrendPoint

class TechnologyForecaster:
    """
    Technology adoption forecaster for predicting emerging technologies & declining skill vectors.
    """

    @staticmethod
    def forecast_emerging_technologies(points: List[MarketTrendPoint]) -> List[Dict[str, Any]]:
        emerging = [p for p in points if p.maturity_stage == "Emerging" or p.emerging_score >= 80.0]
        emerging.sort(key=lambda x: x.emerging_score, reverse=True)
        return [
            {
                "name": p.name,
                "category": p.category,
                "emerging_score": p.emerging_score,
                "projected_growth_3yr": f"+{round(p.growth_rate_yoy * 2.8, 1)}%",
                "adoption_stage": "Early Adopters"
            }
            for p in emerging
        ]

    @staticmethod
    def identify_declining_skills() -> List[Dict[str, Any]]:
        return [
            {
                "name": "Legacy COBOL & Fortran",
                "category": "Legacy Systems",
                "decline_rate_yoy": "-14.2%",
                "risk_tier": "High",
                "recommended_pivot": "Modern Cloud & Go Services"
            },
            {
                "name": "Manual QA Test Scripting",
                "category": "Testing",
                "decline_rate_yoy": "-22.5%",
                "risk_tier": "High",
                "recommended_pivot": "Automated Cypress/Playwright & AI Testing"
            }
        ]
