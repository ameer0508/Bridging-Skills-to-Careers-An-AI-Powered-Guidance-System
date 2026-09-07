from typing import Dict, Any

class ConsentManager:
    """
    Manages granular user consent preferences per memory category.
    """

    @staticmethod
    def get_consent_settings(user_id: str) -> Dict[str, Any]:
        return {
            "episodic_consent": True,
            "semantic_consent": True,
            "preference_consent": True,
            "conversation_consent": True
        }
