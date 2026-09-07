from typing import List, Dict, Any

class ContradictionDetector:
    """
    Detects cross-channel contradictions (e.g. Resume claims Kubernetes but 0 repository or portfolio evidence found).
    """

    @staticmethod
    def detect_contradictions(user_id: str, claimed_skills: List[str], verified_skills: List[str]) -> List[Dict[str, Any]]:
        contradictions = []
        for skill in claimed_skills:
            if skill not in verified_skills:
                contradictions.append({
                    "user_id": user_id,
                    "claimed_item": skill,
                    "issue": f"Claimed '{skill}' on resume/profile but no codebase artifact or portfolio evidence was detected.",
                    "severity": "HIGH_EVIDENCE_GAP"
                })
        return contradictions
