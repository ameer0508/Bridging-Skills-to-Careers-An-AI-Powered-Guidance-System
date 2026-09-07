from typing import List, Dict, Any

class InterviewTracker:
    """
    Tracks scheduled interview rounds, interviewers, & preparation cheat-sheets.
    """

    @staticmethod
    def get_scheduled_interviews(user_id: str) -> List[Dict[str, Any]]:
        return [
            {
                "interview_id": "int_404",
                "company": "OpenScale AI Systems",
                "round_name": "System Design & Vector Index Architecture",
                "scheduled_at": "2026-08-05T14:00:00Z",
                "prep_status": "Ready (Cheat-sheet Generated)"
            }
        ]
