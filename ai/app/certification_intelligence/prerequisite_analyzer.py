from typing import List, Dict, Any
from app.certification_intelligence.provider_interface import CertificationItem

class PrerequisiteAnalyzer:
    """
    Analyzes certification prerequisites, experience requirements, and foundational readiness.
    """

    @staticmethod
    def analyze_prerequisites(
        certs: List[CertificationItem],
        user_skills: List[str]
    ) -> Dict[str, Any]:
        user_skills_lower = {s.lower() for s in user_skills}
        all_prereqs = set()
        missing = set()

        for c in certs:
            for p in c.prerequisites:
                all_prereqs.add(p)
                if p.lower() not in user_skills_lower:
                    missing.add(p)

        return {
            "required_prerequisites": list(all_prereqs),
            "missing_prerequisites": list(missing),
            "is_eligible_for_exam": len(missing) == 0,
            "readiness_summary": (
                "Prerequisites verified. Fully eligible to attempt examination."
                if not missing else f"Complete prerequisite modules in {', '.join(missing)} prior to registering for exam."
            )
        }
