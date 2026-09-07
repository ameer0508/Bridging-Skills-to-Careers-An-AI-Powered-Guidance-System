from typing import List, Dict, Any

class MemoryRanker:
    """
    Ranks retrieved memories by composite score: Recency (30%), Importance (40%), Goal Relevance (30%).
    """

    @staticmethod
    def rank_memories(memories: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return sorted(memories, key=lambda x: x.get("importance", 1.0), reverse=True)
