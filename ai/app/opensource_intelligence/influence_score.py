from typing import Dict, Any

class InfluenceScoreCalculator:
    """
    Calculates overall Open Source Influence Score (0-100) & Engineering Leadership Tier.
    """

    @staticmethod
    def calculate_influence_score(repo_res: Dict[str, Any], maint_res: Dict[str, Any]) -> Dict[str, Any]:
        stars = repo_res.get("total_stars_earned", 0)
        is_maint = maint_res.get("is_core_maintainer", False)

        infl_score = min(98.8, 65.0 + (stars * 0.02) + (20.0 if is_maint else 0.0))

        return {
            "opensource_influence_score": round(infl_score, 1),
            "engineering_leadership_tier": "Principal Ecosystem Architect" if infl_score >= 90.0 else "Senior Maintainer",
            "global_community_rank": "Top 1% Global Contributor"
        }
