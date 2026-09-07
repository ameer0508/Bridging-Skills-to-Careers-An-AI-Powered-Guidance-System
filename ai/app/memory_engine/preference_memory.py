from typing import Dict, Any

class PreferenceMemoryStore:
    """
    Stores user preferences (learning pace, remote work, target compensation, communication style).
    """

    @staticmethod
    def get_preferences(user_id: str) -> Dict[str, Any]:
        return {
            "work_environment": "Hybrid / Remote",
            "target_compensation_usd": 240000,
            "learning_pace": "ACCELERATED",
            "communication_style": "Concise Technical"
        }
