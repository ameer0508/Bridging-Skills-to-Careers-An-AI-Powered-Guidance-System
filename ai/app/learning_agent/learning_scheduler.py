from typing import Dict, Any, List

class LearningScheduler:
    """
    Schedules daily study sessions, lab blocks, & capstone project build time.
    """

    @staticmethod
    def create_schedule(user_id: str) -> List[Dict[str, Any]]:
        return [
            {"day": "Monday", "focus": "HNSW Indexing Theory & Math", "allocated_minutes": 60},
            {"day": "Wednesday", "focus": "Hands-On Milvus Benchmarking Lab", "allocated_minutes": 90},
            {"day": "Saturday", "focus": "Capstone Project: FastAPI Vector RAG Engine", "allocated_minutes": 120}
        ]
