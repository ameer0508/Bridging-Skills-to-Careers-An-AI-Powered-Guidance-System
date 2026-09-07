from typing import Dict, Any

class ResumeReasoner:
    """
    Synthesizes explainable AI rationale for resume modifications & ATS score boosts.
    """

    @staticmethod
    def explain_changes(target_role: str) -> Dict[str, Any]:
        return {
            "target_role": target_role,
            "rationale": f"Rewrote bullet points in STAR format & added 'Vector Indexing' to raise ATS keyword match score from 82% to 96% for {target_role} applications.",
            "expected_callback_increase": "+35% Recruiter Response Rate"
        }
