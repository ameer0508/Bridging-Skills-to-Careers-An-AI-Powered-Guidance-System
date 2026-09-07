from typing import Dict, Any

class ProfileParser:
    """
    Parses & normalizes raw LinkedIn API JSON exports into standardized profile objects.
    """

    @staticmethod
    def parse_profile(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "profile_id": raw_data.get("profile_id", "unknown"),
            "headline": raw_data.get("headline", ""),
            "summary": raw_data.get("summary", ""),
            "total_connections": raw_data.get("connections", 0),
            "experiences_count": len(raw_data.get("experiences", [])),
            "skills_count": len(raw_data.get("skills", []))
        }
