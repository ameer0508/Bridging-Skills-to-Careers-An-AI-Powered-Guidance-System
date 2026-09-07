from typing import List, Dict, Any

class IndustryAnalyzer:
    """
    Analyzes hiring health scores, hiring velocity, and tech adoption across major industrial sectors.
    """

    @staticmethod
    def get_industry_health_scores() -> List[Dict[str, Any]]:
        return [
            {
                "industry": "Artificial Intelligence & ML",
                "health_score": 96.5,
                "growth_yoy": "+32.4%",
                "hiring_velocity": "Ultra High",
                "hiring_risk": "Low"
            },
            {
                "industry": "Cloud Infrastructure & DevOps",
                "health_score": 92.0,
                "growth_yoy": "+24.0%",
                "hiring_velocity": "High",
                "hiring_risk": "Low"
            },
            {
                "industry": "Cybersecurity & Zero Trust",
                "health_score": 90.5,
                "growth_yoy": "+26.8%",
                "hiring_velocity": "High",
                "hiring_risk": "Low"
            },
            {
                "industry": "FinTech & Automated Trading",
                "health_score": 88.0,
                "growth_yoy": "+18.2%",
                "hiring_velocity": "Moderate-High",
                "hiring_risk": "Low-Moderate"
            },
        ]
