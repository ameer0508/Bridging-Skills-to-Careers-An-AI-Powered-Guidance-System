from typing import List, Dict, Any

class RecommendationReasoner:
    """
    Generates explicit, transparent "Why Recommended" rationale and supporting evidence traces.
    """

    @classmethod
    def generate_reasoning(
        cls,
        title: str,
        item_type: str,
        career_goal: str,
        skills_improved: List[str]
    ) -> Dict[str, Any]:

        skills_str = ", ".join(skills_improved) if skills_improved else "core technical domain"

        why = f"Recommended to bridge key skill delta in {skills_str} required for high-impact {career_goal} positions."
        evidence = [
            f"Target role '{career_goal}' lists {skills_str} as mandatory core competencies.",
            f"Completing this {item_type} directly elevates your candidate profile competitiveness.",
            "High industry demand with strong recruiter search index."
        ]

        return {
            "why_recommended": why,
            "supporting_evidence": evidence
        }
