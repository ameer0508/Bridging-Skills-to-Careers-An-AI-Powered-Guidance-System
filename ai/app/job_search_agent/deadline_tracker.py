from typing import List, Dict, Any

class DeadlineTracker:
    """
    Tracks application deadline expirations & priority response windows.
    """

    @staticmethod
    def get_upcoming_deadlines(user_id: str) -> List[Dict[str, Any]]:
        return [
            {
                "job_id": "job_ai_01",
                "company": "OpenScale AI Systems",
                "deadline": "2026-08-15",
                "days_remaining": 14,
                "urgency": "NORMAL"
            }
        ]
