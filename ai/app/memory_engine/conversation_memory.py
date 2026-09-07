from typing import List, Dict, Any

class ConversationMemoryStore:
    """
    Stores multi-agent conversation transcripts, summaries, & context windows.
    """

    @staticmethod
    def get_conversation_summaries(user_id: str) -> List[Dict[str, Any]]:
        return [
            {"session_id": "sess_102", "summary": "User inquired about vector indexing benchmarking & compensation negotiation."}
        ]
