from typing import List, Dict, Any
from app.course_intelligence.provider_interface import CourseItem

class PrerequisiteDetector:
    """
    Detects prerequisite skill gaps and recommends foundational bridge courses.
    """

    @staticmethod
    def detect_missing_prerequisites(
        courses: List[CourseItem],
        user_skills: List[str]
    ) -> Dict[str, Any]:
        user_skills_lower = {s.lower() for s in user_skills}
        all_prereqs = set()
        missing_prereqs = set()

        for c in courses:
            for p in c.prerequisites:
                all_prereqs.add(p)
                if p.lower() not in user_skills_lower:
                    missing_prereqs.add(p)

        return {
            "required_prerequisites": list(all_prereqs),
            "missing_prerequisites": list(missing_prereqs),
            "has_prerequisite_gaps": len(missing_prereqs) > 0,
            "bridge_recommendation": (
                f"Complete foundation modules in {', '.join(missing_prereqs)} before advancing to core curriculum."
                if missing_prereqs else "No prerequisite gaps detected. Ready to start core track."
            )
        }
