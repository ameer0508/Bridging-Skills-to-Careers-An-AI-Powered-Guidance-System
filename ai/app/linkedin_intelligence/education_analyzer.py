from typing import List, Dict, Any

class EducationAnalyzer:
    """
    Evaluates degree alignment, academic background, & education credentials.
    """

    @staticmethod
    def analyze_education(educations: List[Dict[str, Any]]) -> Dict[str, Any]:
        has_cs_degree = any("Computer Science" in e.get("degree", "") for e in educations)
        return {
            "has_stem_degree": has_cs_degree,
            "education_alignment_score": 95.0 if has_cs_degree else 75.0,
            "highest_degree": educations[0].get("degree", "Bachelor Degree") if educations else "None"
        }
