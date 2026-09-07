from typing import List, Dict, Any

class ScholarshipEngine:
    """
    Discovers academic & professional tech scholarships & research grants.
    """

    @staticmethod
    def get_scholarships() -> List[Dict[str, Any]]:
        return [
            {
                "scholarship_id": "sch_ai_01",
                "title": "Advanced Distributed Systems Leadership Grant",
                "amount_usd": 25000,
                "provider": "ACM & IEEE Computer Society"
            }
        ]
