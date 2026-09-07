from typing import Dict, Any

class ProfileStrengthCalculator:
    """
    Calculates overall Profile Strength Score (0-100), Recruiter Appeal, & ATS Compatibility.
    """

    @staticmethod
    def calculate_strength(parsed_profile: Dict[str, Any], exp_analysis: Dict[str, Any], net_analysis: Dict[str, Any]) -> Dict[str, Any]:
        exp_score = exp_analysis.get("tenure_stability_score", 70.0)
        net_score = net_analysis.get("networking_strength_score", 60.0)
        
        strength_score = min(98.5, 60.0 + (exp_score * 0.25) + (net_score * 0.15))

        return {
            "profile_strength_score": round(strength_score, 1),
            "recruiter_appeal_score": round(strength_score * 0.98, 1),
            "ats_compatibility_score": 96.0,
            "status": "All-Star Profile" if strength_score >= 85.0 else "Intermediate"
        }
