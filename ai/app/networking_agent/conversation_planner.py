from typing import List, Dict, Any

class ConversationPlanner:
    """
    Generates tailored conversation icebreakers & technical topics for networking calls.
    """

    @staticmethod
    def plan_topics(connection_name: str) -> List[str]:
        return [
            f"Ask {connection_name} about their experience scaling Milvus cluster nodes under spike workloads.",
            "Discuss trade-offs of product quantization in high-dimensional vector search."
        ]
