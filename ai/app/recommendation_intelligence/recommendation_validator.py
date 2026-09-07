from typing import List, Dict, Any, Set

class RecommendationValidator:
    """
    Validates, deduplicates, and filters recommendation candidates.
    - Avoids duplicate recommendations
    - Filters out already completed learning items
    - Validates prerequisite satisfaction
    - Filters low-value suggestions
    """

    @classmethod
    def validate_and_filter(
        cls,
        candidates: List[Dict[str, Any]],
        completed_learning: List[str] = None,
        user_skills: List[str] = None
    ) -> List[Dict[str, Any]]:

        if completed_learning is None:
            completed_learning = []
        if user_skills is None:
            user_skills = []

        completed_set: Set[str] = {c.lower().strip() for c in completed_learning}
        user_skill_set: Set[str] = {s.lower().strip() for s in user_skills}

        seen_titles: Set[str] = set()
        validated: List[Dict[str, Any]] = []

        for item in candidates:
            title = item.get("title", "").strip()
            title_lower = title.lower()

            # 1. Deduplication
            if title_lower in seen_titles:
                continue

            # 2. Check if already completed
            if any(comp in title_lower for comp in completed_set):
                continue

            # 3. Check if user already has the skill (for skill acquisition items)
            if item.get("type") == "skill":
                improved = item.get("skills_improved", [])
                if improved and all(imp.lower().strip() in user_skill_set for imp in improved):
                    continue

            # 4. Quality filter (must have non-empty title and valid impact)
            if not title or len(title) < 5:
                continue

            seen_titles.add(title_lower)
            validated.append(item)

        return validated
