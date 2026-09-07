from typing import List, Dict, Any

class OpportunityDeadlineMonitor:
    """
    Monitors upcoming application deadlines & priority response windows.
    """

    @staticmethod
    def get_urgent_deadlines(user_id: str) -> List[Dict[str, Any]]:
        return [
            {
                "opportunity_id": "opp_acc_01",
                "title": "Y Combinator AI Scale-Out Batch",
                "deadline": "2026-08-25",
                "days_remaining": 24,
                "urgency": "NORMAL"
            }
        ]
