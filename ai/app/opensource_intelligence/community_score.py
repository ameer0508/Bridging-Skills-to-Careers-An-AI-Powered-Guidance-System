from typing import Dict, Any

class CommunityScoreCalculator:
    """
    Computes overall Community Trust Score (0-100) & Mentorship Potential.
    """

    @staticmethod
    def calculate_community_score(contrib_res: Dict[str, Any], review_res: Dict[str, Any]) -> Dict[str, Any]:
        commits = contrib_res.get("total_commits_past_year", 0)
        reviews = review_res.get("code_reviews_performed", 0)

        comm_score = min(98.5, 60.0 + (commits * 0.03) + (reviews * 0.15))

        return {
            "community_trust_score": round(comm_score, 1),
            "mentorship_potential": "High Mentorship Potential (Core Leader)",
            "status": "Community Pillar" if comm_score >= 85.0 else "Contributor"
        }
