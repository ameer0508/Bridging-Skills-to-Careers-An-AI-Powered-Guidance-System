from typing import Dict, Any

class DigestGenerator:
    """
    Generates structured daily & weekly career digests.
    """

    @staticmethod
    def generate_digest(user_id: str) -> Dict[str, Any]:
        return {
            "digest_id": "dig_88",
            "period": "WEEKLY",
            "highlights": ["Mastered Vector Indexing & Milvus", "Achieved 98.2% Job Match at OpenScale AI", "Obtained 3.5x Referral Boost"]
        }
