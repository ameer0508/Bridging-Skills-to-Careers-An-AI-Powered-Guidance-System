from typing import Dict, Any, List

class ApplicationTracker:
    """
    Tracks active user job applications (Applied, Interviewing, Offer Received, Archived).
    """

    @staticmethod
    def get_tracked_applications(user_id: str) -> List[Dict[str, Any]]:
        return [
            {
                "application_id": "app_991",
                "job_title": "Principal AI Infrastructure Architect",
                "company": "OpenScale AI Systems",
                "status": "Interviewing (Round 2: System Design)",
                "applied_date": "2026-07-20",
                "next_action": "System Design Onsite Presentation"
            }
        ]
