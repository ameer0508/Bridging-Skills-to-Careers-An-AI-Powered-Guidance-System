"""
Adaptive Sequencer Module for Adaptive AI Learning Roadmap Engine.
Dynamically re-evaluates learning sequences when skills improve or user completes/skips milestones.
"""

from typing import List, Dict, Any


class AdaptiveSequencer:
    """
    Dynamically adjusts roadmap phases and milestone sequencing based on user progress and skill acquisition.
    """

    def __init__(self):
        pass

    def adapt_phases(
        self,
        phases: List[Dict[str, Any]],
        user_acquired_skills: List[str] = None,
        completed_milestones: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Filters out completed skills/milestones and recalculates phase durations dynamically.
        """
        acquired_set = set(s.lower().strip() for s in (user_acquired_skills or []))
        completed_set = set(m.lower().strip() for m in (completed_milestones or []))

        adapted_phases: List[Dict[str, Any]] = []

        for phase in phases:
            raw_skills = phase.get("focus_skills", [])
            raw_milestones = phase.get("milestones", [])

            # Filter focus skills that are already mastered
            remaining_skills = [s for s in raw_skills if s.lower().strip() not in acquired_set]

            # Filter milestones that are already completed
            remaining_milestones = [m for m in raw_milestones if m.lower().strip() not in completed_set]

            # If all skills and milestones in a phase are complete, mark phase as complete / zero duration
            original_weeks = phase.get("duration_weeks", 4)
            if not remaining_skills and not remaining_milestones:
                duration = 0
            else:
                completion_ratio = len(remaining_skills) / max(len(raw_skills), 1)
                duration = max(1, round(original_weeks * completion_ratio))

            adapted_phase = dict(phase)
            adapted_phase["focus_skills"] = remaining_skills or raw_skills[:1]
            adapted_phase["milestones"] = remaining_milestones or ["Phase Milestones Mastered"]
            adapted_phase["duration_weeks"] = duration
            adapted_phases.append(adapted_phase)

        # Filter out empty zero-duration phases if other active phases remain
        active_phases = [p for p in adapted_phases if p.get("duration_weeks", 0) > 0]
        return active_phases if active_phases else adapted_phases
