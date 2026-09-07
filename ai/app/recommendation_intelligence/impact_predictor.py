from typing import Dict, Any, List

class ImpactPredictor:
    """
    Predicts career impact metrics for recommendations:
    - Readiness increase %
    - Match score increase %
    - Salary potential boost
    - Hiring competitiveness boost
    """

    @classmethod
    def predict_impact(
        cls,
        item_title: str,
        item_type: str,
        target_role: str,
        skills_improved: List[str]
    ) -> Dict[str, Any]:

        num_skills = len(skills_improved)

        if item_type in ["project", "certification"]:
            readiness_boost = round(min(12.0 + num_skills * 2.5, 25.0), 1)
            match_boost = round(min(14.0 + num_skills * 3.0, 30.0), 1)
            competitiveness = "High (+35% Recruiter Callback Rate)"
            salary_boost = "+$8,000 - $15,000 / year"
        elif item_type in ["course", "skill", "technology"]:
            readiness_boost = round(min(8.0 + num_skills * 2.0, 18.0), 1)
            match_boost = round(min(10.0 + num_skills * 2.5, 22.0), 1)
            competitiveness = "Moderate (+20% Recruiter Callback Rate)"
            salary_boost = "+$5,000 - $10,000 / year"
        elif item_type in ["interview_prep", "resume_improvement", "portfolio_improvement", "github_improvement"]:
            readiness_boost = 15.0
            match_boost = 10.0
            competitiveness = "Very High (+50% Interview Pass Rate)"
            salary_boost = "Immediate Hiring Payoff"
        else:
            readiness_boost = 5.0
            match_boost = 5.0
            competitiveness = "Networking Referral Boost"
            salary_boost = "Long-term Career Growth"

        return {
            "estimated_readiness_improvement": readiness_boost,
            "estimated_match_score_improvement": match_boost,
            "hiring_competitiveness": competitiveness,
            "salary_potential": salary_boost,
            "summary": f"Completing this {item_type} will boost career readiness by +{readiness_boost}% and role match score by +{match_boost}% for {target_role}."
        }
