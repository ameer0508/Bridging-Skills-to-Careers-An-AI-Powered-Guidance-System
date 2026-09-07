"""
Dependency Analyzer Module for Adaptive AI Learning Roadmap Engine.
Validates prerequisite DAG relationships to prevent invalid learning sequences.
"""

from typing import List, Dict, Set, Any, Tuple


DEFAULT_PREREQUISITE_MAP: Dict[str, List[str]] = {
    "data structures": ["python", "java", "c++", "programming fundamentals"],
    "algorithms": ["data structures", "mathematics"],
    "machine learning": ["python", "linear algebra", "statistics", "data structures"],
    "deep learning": ["machine learning", "calculus", "pytorch", "tensorflow"],
    "llms": ["deep learning", "transformers", "natural language processing"],
    "rag pipelines": ["llms", "vector databases", "python"],
    "agentic ai": ["llms", "rag pipelines", "python"],
    "async fastapi": ["python", "rest apis"],
    "microservices": ["async fastapi", "docker", "rest apis"],
    "kubernetes": ["docker", "linux", "networking"],
    "react 19": ["javascript", "html", "css", "typescript"],
    "next.js": ["react 19", "typescript"],
}


class DependencyAnalyzer:
    """
    Analyzes skill prerequisite relationships and ensures learning phases respect topological dependencies.
    """

    def __init__(self, prerequisite_map: Dict[str, List[str]] = None):
        self.prerequisites = prerequisite_map or DEFAULT_PREREQUISITE_MAP

    def get_prerequisites(self, skill: str) -> List[str]:
        """Returns direct prerequisites for a given skill."""
        return self.prerequisites.get(skill.lower().strip(), [])

    def get_all_ancestor_prerequisites(self, skill: str) -> Set[str]:
        """Recursively resolves all ancestor prerequisites for a given skill."""
        normalized = skill.lower().strip()
        ancestors: Set[str] = set()

        def _resolve(target: str):
            for prereq in self.prerequisites.get(target, []):
                if prereq not in ancestors:
                    ancestors.add(prereq)
                    _resolve(prereq)

        _resolve(normalized)
        return ancestors

    def validate_sequence(self, skill_sequence: List[str], user_acquired_skills: List[str] = None) -> Tuple[bool, List[str]]:
        """
        Validates if a sequence of skills satisfies prerequisite ordering.
        Returns (is_valid, list_of_violations).
        """
        acquired = set(s.lower().strip() for s in (user_acquired_skills or []))
        violations: List[str] = []

        for skill in skill_sequence:
            norm_skill = skill.lower().strip()
            prereqs = self.get_prerequisites(norm_skill)

            missing = [p for p in prereqs if p not in acquired]
            if missing:
                violations.append(f"Skill '{skill}' requires missing prerequisites: {', '.join(missing)}")

            acquired.add(norm_skill)

        return len(violations) == 0, violations

    def sort_topologically(self, skills: List[str]) -> List[str]:
        """Topologically sorts skills based on prerequisite DAG order."""
        skills_set = set(s.lower().strip() for s in skills)
        graph: Dict[str, Set[str]] = {s: set() for s in skills_set}
        in_degree: Dict[str, int] = {s: 0 for s in skills_set}

        for skill in skills_set:
            for prereq in self.get_prerequisites(skill):
                if prereq in skills_set:
                    graph[prereq].add(skill)
                    in_degree[skill] += 1

        queue = [s for s in skills_set if in_degree[s] == 0]
        sorted_skills: List[str] = []

        while queue:
            curr = queue.pop(0)
            sorted_skills.append(curr)
            for neighbor in graph[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        # Include any remaining skills to handle cycles or unmapped nodes
        for s in skills_set:
            if s not in sorted_skills:
                sorted_skills.append(s)

        return sorted_skills
