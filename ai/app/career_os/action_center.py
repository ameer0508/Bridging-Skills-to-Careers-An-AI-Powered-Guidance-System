from typing import List, Dict, Any

class ActionCenter:
    """
    Centralizes pending user approvals, action items, & workflow requests.
    """

    @staticmethod
    def get_action_items(user_id: str) -> List[Dict[str, Any]]:
        return [
            {"id": "act_01", "type": "HUMAN_APPROVAL", "title": "Authorize InMail Outreach Draft to Dr. Sarah Chen", "urgent": False},
            {"id": "act_02", "type": "STUDY_BLOCK", "title": "Complete Vector Indexing Mastery Quiz", "urgent": True}
        ]
