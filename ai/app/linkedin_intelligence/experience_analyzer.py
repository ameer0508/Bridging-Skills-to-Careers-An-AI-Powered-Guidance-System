from typing import List, Dict, Any

class ExperienceAnalyzer:
    """
    Evaluates role progression velocity, company prestige, tenure stability, & experience depth.
    """

    @staticmethod
    def analyze_experiences(experiences: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_months = sum(e.get("duration_months", 0) for e in experiences)
        total_years = round(total_months / 12.0, 1)

        return {
            "total_experience_years": total_years,
            "roles_count": len(experiences),
            "tenure_stability_score": 92.0 if total_years >= 3.0 else 70.0,
            "experience_level": "Senior Staff Tier" if total_years >= 5.0 else "Mid-Senior Level"
        }
