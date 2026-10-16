from typing import Any, Dict
from app.schemas.modules import AnalyticsRequest

# Figures this route used to return from fixed tables and constants, not from any data: they are
# not produced. No licensed market, salary or hiring-outcome data exists to ground them
# (docs/MARKET_DATA_SOURCES.md), so returning them would present invented numbers as intelligence.
NOT_PRODUCED = [
    "overall_skill_growth_rate",
    "market_relevance_index",
    "readiness_forecast",
    "salary_prediction",
    "market_forecast",
    "career_progression",
    "interview_success",
    "simulation_results",
    "executive_insights",
]

REASON = (
    "Predictive career analytics need dated outcome, market and salary data. None is available "
    "under a licence that allows it, so no forecast, salary or growth figure is produced. The "
    "dashboard analytics computed from your stored data are served by the backend."
)


def generate_analytics_via_ai(request: AnalyticsRequest) -> Dict[str, Any]:
    """
    Answers honestly that predictive analytics are unavailable. The only values returned are exact
    counts of what the caller sent; nothing is estimated, defaulted or scored.
    """
    return {
        "success": False,
        "available": False,
        "status": "insufficient_evidence",
        "feature": "predictive_career_analytics",
        "reason": REASON,
        "not_produced": NOT_PRODUCED,
        "inputs_received": {
            "skills": len(request.user_skills or []),
            "skills_trend_points": len(request.skills_trend or []),
            "simulation_scenario": request.simulation_scenario is not None,
        },
        "data": None,
        "confidence": None,
    }
