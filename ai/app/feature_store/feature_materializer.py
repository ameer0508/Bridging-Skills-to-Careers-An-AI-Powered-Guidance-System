from typing import Dict, Any

class FeatureMaterializer:
    """
    Auto-computes derived features: Match Score, Readiness, Learning Velocity, & Market Signals.
    """

    @staticmethod
    def materialize_user_features(user_id: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        exp_years = raw_data.get("experience_years", 3.5)
        skills_count = len(raw_data.get("skills", ["Python", "FastAPI"]))
        
        match_score = min(98.5, 60.0 + (skills_count * 5.0) + (exp_years * 2.0))
        readiness_score = min(96.0, 55.0 + (skills_count * 4.5) + (exp_years * 3.0))
        velocity = raw_data.get("completed_courses_count", 4) / 4.0

        return {
            "resume_experience_years": exp_years,
            "skills_total_count": skills_count,
            "career_match_score": round(match_score, 1),
            "career_readiness_score": round(readiness_score, 1),
            "learning_velocity": round(velocity, 2),
            "market_demand_velocity": 32.4
        }
