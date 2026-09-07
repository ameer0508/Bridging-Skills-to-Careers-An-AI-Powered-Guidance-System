"""
Roadmap Validator Module for Adaptive AI Learning Roadmap Engine.
Validates prerequisite ordering, checks milestone completeness, and prevents sequence deadlocks.
"""

from typing import List, Dict, Any, Tuple
from app.roadmap_intelligence.dependency_analyzer import DependencyAnalyzer


class RoadmapValidator:
    """
    Ensures that generated roadmap phases satisfy strict sequence validity, have non-empty focus skills,
    and do not contain duplicate or deadlocked learning items.
    """

    def __init__(self, dependency_analyzer: DependencyAnalyzer = None):
        self.dep_analyzer = dependency_analyzer or DependencyAnalyzer()

    def validate_roadmap(self, phases: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        """
        Validates phase structure, focus skills, and topological prerequisite ordering.
        Returns (is_valid, list_of_errors).
        """
        errors: List[str] = []

        if not phases:
            return False, ["Roadmap contains no phases."]

        all_focus_skills: List[str] = []
        for p in phases:
            skills = p.get("focus_skills", [])
            if not skills:
                errors.append(f"Phase {p.get('phase', 0)} has empty focus_skills.")
            all_focus_skills.extend(skills)

        # Check sequence validity
        is_valid, violations = self.dep_analyzer.validate_sequence(all_focus_skills)
        if not is_valid:
            errors.extend(violations)

        return len(errors) == 0, errors
