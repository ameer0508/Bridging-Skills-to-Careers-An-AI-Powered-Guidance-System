from typing import List, Dict, Any

class GoalMemoryStore:
    """
    Stores long-term career aspirations, target roles, & milestone completion targets.
    """

    @staticmethod
    def get_goals(user_id: str) -> List[Dict[str, Any]]:
        return [
            {"goal_id": "g_01", "title": "Become Principal AI Infrastructure Architect", "target_date": "2026-12-31", "progress_percent": 85.0}
        ]
