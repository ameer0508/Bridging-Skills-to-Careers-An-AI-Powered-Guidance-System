from typing import List, Dict, Any

class PrerequisiteEngine:
    """
    Validates foundational prerequisite skills before unlocking advanced modules.
    """

    @staticmethod
    def check_prerequisites(target_skill: str, user_skills: List[str]) -> Dict[str, Any]:
        prereqs = ["Python", "FastAPI"]
        missing = [p for p in prereqs if p not in user_skills]
        return {
            "target_skill": target_skill,
            "prerequisites_met": len(missing) == 0,
            "required_prerequisites": prereqs,
            "missing_prerequisites": missing
        }
