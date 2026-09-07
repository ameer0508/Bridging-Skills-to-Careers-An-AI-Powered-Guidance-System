from typing import List, Dict, Any

class SessionHistoryManager:
    """
    Tracks & retrieves historical mock interview transcripts & scores.
    """

    @staticmethod
    def get_history(user_id: str) -> List[Dict[str, Any]]:
        return [
            {"session_id": "sess_99", "date": "2026-07-28", "type": "System Design", "score": 94.0},
            {"session_id": "sess_98", "date": "2026-07-22", "type": "Behavioral STAR", "score": 92.0}
        ]
