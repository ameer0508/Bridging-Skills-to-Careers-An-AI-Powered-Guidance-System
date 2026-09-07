"""
Scenario Simulator Module for Predictive Analytics & Career Intelligence Engine.
Executes "What-If" scenario simulations to evaluate the impact of skill, cert, or goal changes.
"""

from typing import List, Dict, Any


class ScenarioSimulator:
    """
    Simulates outcome metrics (readiness, match score, salary, interview callback rate) under hypothetical user actions.
    """

    def simulate_scenario(
        self,
        baseline_readiness: float,
        baseline_match: float,
        scenario: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates updated metrics based on simulation scenario parameters.
        Examples:
          scenario = {"action": "complete_certification", "certification_name": "AWS Certified Solutions Architect"}
          scenario = {"action": "adjust_study_hours", "weekly_hours": 20}
          scenario = {"action": "complete_roadmap"}
        """
        action = scenario.get("action", "custom_action")

        readiness_boost = 0.0
        match_boost = 0.0
        salary_boost_pct = 0.0
        callback_boost_pct = 0.0

        if action == "complete_certification":
            cert_name = scenario.get("certification_name", "Industry Certification")
            readiness_boost = 6.5
            match_boost = 8.0
            salary_boost_pct = 8.5
            callback_boost_pct = 15.0
            description = f"Simulated impact of completing '{cert_name}' certification."

        elif action == "adjust_study_hours":
            hours = scenario.get("weekly_hours", 15)
            hours_delta = hours - 15
            readiness_boost = hours_delta * 0.8
            match_boost = hours_delta * 0.9
            salary_boost_pct = hours_delta * 0.5
            callback_boost_pct = hours_delta * 1.2
            description = f"Simulated impact of adjusting study commitment to {hours} hours/week."

        elif action == "complete_roadmap":
            readiness_boost = 22.0
            match_boost = 25.0
            salary_boost_pct = 20.0
            callback_boost_pct = 40.0
            description = "Simulated impact of completing 100% of current learning roadmap."

        else:
            readiness_boost = 5.0
            match_boost = 6.0
            salary_boost_pct = 5.0
            callback_boost_pct = 10.0
            description = f"Simulated custom scenario: {action}."

        simulated_readiness = min(99.0, baseline_readiness + readiness_boost)
        simulated_match = min(99.0, baseline_match + match_boost)

        return {
            "scenario_action": action,
            "description": description,
            "baseline_readiness": baseline_readiness,
            "simulated_readiness": round(simulated_readiness, 1),
            "readiness_gain": round(readiness_boost, 1),
            "baseline_match": baseline_match,
            "simulated_match": round(simulated_match, 1),
            "match_gain": round(match_boost, 1),
            "estimated_salary_boost_pct": round(salary_boost_pct, 1),
            "recruiter_callback_boost_pct": round(callback_boost_pct, 1),
            "confidence": 0.94
        }
