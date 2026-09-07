"""
Timeline Predictor Module for Adaptive AI Learning Roadmap Engine.
Computes estimated completion weeks, milestone dates, and career readiness target dates.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta


class TimelinePredictor:
    """
    Predicts completion timelines based on target duration, weekly hours available, and phase difficulty.
    """

    def predict_timeline(
        self,
        phases: List[Dict[str, Any]],
        weekly_hours: int = 15,
        start_date: datetime = None
    ) -> Dict[str, Any]:
        """
        Computes total estimated weeks, total estimated months, and milestone completion dates.
        """
        start = start_date or datetime.now()
        total_weeks = sum(p.get("duration_weeks", 4) for p in phases)

        # Scale weeks if user works fewer/more than baseline 15 hrs/week
        scale_factor = 15 / max(weekly_hours, 5)
        adjusted_total_weeks = max(1, round(total_weeks * scale_factor))
        estimated_months = max(1, round(adjusted_total_weeks / 4.33))

        readiness_date = start + timedelta(weeks=adjusted_total_weeks)

        phase_timelines: List[Dict[str, Any]] = []
        accumulated_weeks = 0

        for phase in phases:
            duration = max(1, round(phase.get("duration_weeks", 4) * scale_factor))
            accumulated_weeks += duration
            completion_date = start + timedelta(weeks=accumulated_weeks)

            phase_timelines.append({
                "phase": phase.get("phase", 1),
                "title": phase.get("title", ""),
                "adjusted_duration_weeks": duration,
                "estimated_completion_date": completion_date.strftime("%Y-%m-%d")
            })

        return {
            "total_estimated_weeks": adjusted_total_weeks,
            "estimated_months": estimated_months,
            "estimated_readiness_date": readiness_date.strftime("%Y-%m-%d"),
            "phase_timelines": phase_timelines
        }
