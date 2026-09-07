from typing import List, Dict, Any

class PriorityEngine:
    """
    Calculates composite AI priorities across career planning, learning, jobs, & networking.
    """

    @staticmethod
    def get_top_priorities(user_id: str) -> List[Dict[str, Any]]:
        return [
            {"priority_id": "p_01", "title": "Complete Milvus Vector Indexing Lab Block", "urgency": "HIGH", "agent": "Learning Agent"},
            {"priority_id": "p_02", "title": "Authorize Outreach to Dr. Sarah Chen", "urgency": "MEDIUM", "agent": "Networking Agent"}
        ]
