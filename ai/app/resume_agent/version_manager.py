from typing import Dict, Any, List

class VersionManager:
    """
    Manages historical resume versions, target role variants, & diff snapshots.
    """

    @staticmethod
    def get_versions(user_id: str) -> List[Dict[str, Any]]:
        return [
            {"version_id": "v1.0-original", "name": "Base Executive Resume", "ats_score": 82.0},
            {"version_id": "v1.1-tailored", "name": "Principal AI Architect Tailored", "ats_score": 96.0}
        ]
