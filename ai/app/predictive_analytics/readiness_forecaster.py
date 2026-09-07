"""
Readiness Forecaster Module for Predictive Analytics & Career Intelligence Engine.
Projects month-by-month career readiness growth trajectories.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta


class ReadinessForecaster:
    """
    Computes month-by-month career readiness trajectory predictions.
    """

    def forecast_readiness(
        self,
        current_readiness: float = 72.0,
        skill_growth_rate: float = 1.15,
        target_months: int = 6
    ) -> Dict[str, Any]:
        """
        Projects month-by-month readiness growth.
        """
        trajectory: List[Dict[str, Any]] = []
        now = datetime.now()
        readiness = current_readiness

        for m in range(1, target_months + 1):
            growth = max(1.5, (95.0 - readiness) * 0.18 * (skill_growth_rate / 1.0))
            readiness = min(99.0, readiness + growth)
            future_date = now + timedelta(days=m * 30)

            trajectory.append({
                "month": m,
                "date": future_date.strftime("%Y-%m"),
                "projected_readiness": round(readiness, 1),
                "growth_increment": round(growth, 1)
            })

        target_readiness_date = (now + timedelta(days=target_months * 30)).strftime("%Y-%m-%d")

        return {
            "baseline_readiness": current_readiness,
            "target_readiness": round(readiness, 1),
            "total_gain": round(readiness - current_readiness, 1),
            "target_readiness_date": target_readiness_date,
            "monthly_trajectory": trajectory
        }
