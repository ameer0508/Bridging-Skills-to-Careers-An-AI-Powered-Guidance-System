"""
Roadmap Engine Module for Adaptive AI Learning Roadmap Engine.
Core candidate generator for phases, milestones, and learning structures.
"""

from typing import List, Dict, Any
from app.roadmap_intelligence.roadmap_planner import RoadmapPlanner
from app.roadmap_intelligence.milestone_generator import MilestoneGenerator


class RoadmapEngine:
    """
    Generates structured candidate roadmap phases and milestone goals.
    """

    def __init__(self):
        self.planner = RoadmapPlanner()
        self.milestone_gen = MilestoneGenerator()

    def generate_candidate_roadmap(
        self,
        current_level: str,
        target_role: str,
        target_months: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Generates candidate roadmap phases enriched with detailed milestones and explainability.
        """
        baseline_phases = self.planner.plan_baseline_phases(current_level, target_role, target_months)

        for phase in baseline_phases:
            p_title = phase.get("title", "")
            f_skills = phase.get("focus_skills", [])
            phase["milestones"] = self.milestone_gen.generate_milestones_for_phase(p_title, f_skills, target_role)

        return baseline_phases
