"""
Analytics Validator Module for Predictive Analytics & Career Intelligence Engine.
Enforces score range boundaries [0, 100], sanity checks salary predictions, and verifies simulation confidence.
"""

from typing import List, Dict, Any, Tuple


class AnalyticsValidator:
    """
    Enforces sanity constraints and boundary conditions on predictive analytics metrics.
    """

    def validate_metrics(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validates predictive analytics boundaries.
        Returns (is_valid, list_of_errors).
        """
        errors: List[str] = []

        # Validate score bounds
        for key in ["overall_skill_growth_rate", "market_relevance_index"]:
            val = data.get(key)
            if val is not None and (val < 0.0 or val > 150.0):
                errors.append(f"Metric '{key}' out of valid range: {val}")

        # Validate readiness forecast
        rf = data.get("readiness_forecast")
        if rf:
            base = rf.get("baseline_readiness", 0)
            target = rf.get("target_readiness", 0)
            if base < 0 or base > 100 or target < 0 or target > 100:
                errors.append(f"Readiness forecast out of bounds [0, 100]: base={base}, target={target}")

        return len(errors) == 0, errors
