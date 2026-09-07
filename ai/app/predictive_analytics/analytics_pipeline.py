"""
Analytics Pipeline Module for Predictive Analytics & Career Intelligence Engine.
Main orchestrator executing the 10-stage predictive pipeline.
"""

from typing import List, Dict, Any
from app.predictive_analytics.predictive_engine import PredictiveEngine
from app.predictive_analytics.analytics_validator import AnalyticsValidator


class AnalyticsPipeline:
    """
    Orchestrates predictive analytics generation, scenario simulation, executive insights synthesis,
    and validation into a unified career intelligence response.
    """

    def __init__(self):
        self.engine = PredictiveEngine()
        self.validator = AnalyticsValidator()

    def process_analytics(
        self,
        user_id: str,
        target_role: str = "Senior AI Engineer",
        current_level: str = "mid",
        user_skills: List[str] = None,
        skills_trend: List[Dict[str, Any]] = None,
        simulation_scenario: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Executes the 10-stage predictive analytics pipeline.
        """
        predictions = self.engine.generate_predictions(
            target_role=target_role,
            current_level=current_level,
            user_skills=user_skills,
            skills_trend=skills_trend,
            simulation_scenario=simulation_scenario
        )

        # Generate Executive Insights & Actionable Tips (Maintaining backward compatibility with AnalyticsInsight)
        insights = [
            {
                "metric": "Skill Growth Velocity",
                "finding": f"Skill acquisition rate is currently {predictions['overall_skill_growth_rate']}x target baseline.",
                "impact": "positive",
                "actionable_tip": "Focus on high-dimensional vector search & Milvus index optimization."
            },
            {
                "metric": "Market Demand Alignment",
                "finding": f"Market relevance index stands at {predictions['market_relevance_index']}%. High recruiter demand.",
                "impact": "positive",
                "actionable_tip": "Highlight RAG architecture & Async FastAPI experience on GitHub README."
            },
            {
                "metric": "Career Readiness Forecast",
                "finding": f"Projected target readiness of {predictions['readiness_forecast']['target_readiness']}% by {predictions['readiness_forecast']['target_readiness_date']}.",
                "impact": "positive",
                "actionable_tip": "Maintain current 15 hrs/week study velocity to achieve readiness on schedule."
            }
        ]

        executive_insights = {
            "current_position": f"Solid technical foundation aligned with {target_role} requirements.",
            "primary_risks": ["System architecture metrics require additional portfolio capstone proof."],
            "highest_impact_next_action": "Build production Milvus vector retrieval backend.",
            "long_term_outlook": "Exceptional (+38% projected compensation growth potential over 12 months)."
        }

        predictions["insights"] = insights
        predictions["executive_insights"] = executive_insights

        # Validate
        is_valid, validation_errors = self.validator.validate_metrics(predictions)
        predictions["is_valid"] = is_valid
        predictions["validation_errors"] = validation_errors

        return predictions
