from typing import List, Dict, Any

class EndorsementAnalyzer:
    """
    Evaluates peer skill endorsements, top endorsed competencies, & social proof validation.
    """

    @staticmethod
    def analyze_endorsements(skills: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_endorsements = sum(s.get("endorsements", 0) for s in skills)
        top_skills = sorted(skills, key=lambda x: x.get("endorsements", 0), reverse=True)[:3]

        return {
            "total_endorsements": total_endorsements,
            "top_endorsed_skills": [s["name"] for s in top_skills],
            "peer_validation_score": min(98.0, 60.0 + (total_endorsements * 0.3))
        }
