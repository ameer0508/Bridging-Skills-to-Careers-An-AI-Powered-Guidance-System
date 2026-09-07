"""
Predictive Engine Module for Predictive Analytics & Career Intelligence Engine.
Core candidate predictive model generator.
"""

from typing import List, Dict, Any
from app.predictive_analytics.readiness_forecaster import ReadinessForecaster
from app.predictive_analytics.salary_predictor import SalaryPredictor
from app.predictive_analytics.market_forecaster import MarketForecaster
from app.predictive_analytics.scenario_simulator import ScenarioSimulator
from app.predictive_analytics.skill_growth_predictor import SkillGrowthPredictor
from app.predictive_analytics.career_progression import CareerProgressionModel
from app.predictive_analytics.interview_success_predictor import InterviewSuccessPredictor


class PredictiveEngine:
    """
    Generates candidate predictive analytics forecasts.
    """

    def __init__(self):
        self.readiness_forecaster = ReadinessForecaster()
        self.salary_predictor = SalaryPredictor()
        self.market_forecaster = MarketForecaster()
        self.scenario_simulator = ScenarioSimulator()
        self.growth_predictor = SkillGrowthPredictor()
        self.progression_model = CareerProgressionModel()
        self.interview_predictor = InterviewSuccessPredictor()

    def generate_predictions(
        self,
        target_role: str = "Senior AI Engineer",
        current_level: str = "mid",
        user_skills: List[str] = None,
        skills_trend: List[Dict[str, Any]] = None,
        simulation_scenario: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Executes all sub-predictive models and compiles baseline predictions.
        """
        skills = user_skills or ["Python", "FastAPI", "Docker", "PyTorch", "Milvus", "TypeScript"]
        skill_count = len(skills)

        # 1. Skill Growth & Relevance
        growth_data = self.growth_predictor.predict_growth(skills_trend, verified_skill_count=skill_count)

        # 2. Readiness Forecast
        readiness_data = self.readiness_forecaster.forecast_readiness(
            current_readiness=78.0,
            skill_growth_rate=growth_data["overall_skill_growth_rate"]
        )

        # 3. Salary Prediction
        salary_data = self.salary_predictor.predict_salary(
            target_role=target_role,
            user_skills=skills
        )

        # 4. Market Forecast
        market_data = self.market_forecaster.forecast_market(target_role=target_role)

        # 5. Career Progression
        progression_data = self.progression_model.predict_progression(
            current_level=current_level,
            verified_skills_count=skill_count,
            readiness_score=78.0
        )

        # 6. Interview Success
        interview_data = self.interview_predictor.predict_interview_success(
            match_score=85.0,
            verified_skills_count=skill_count
        )

        # 7. Optional Scenario Simulation
        simulation_data = None
        if simulation_scenario:
            simulation_data = self.scenario_simulator.simulate_scenario(
                baseline_readiness=78.0,
                baseline_match=85.0,
                scenario=simulation_scenario
            )

        return {
            "overall_skill_growth_rate": growth_data["overall_skill_growth_rate"],
            "market_relevance_index": growth_data["market_relevance_index"],
            "readiness_forecast": readiness_data,
            "salary_prediction": salary_data,
            "market_forecast": market_data,
            "career_progression": progression_data,
            "interview_success": interview_data,
            "simulation_results": simulation_data
        }
