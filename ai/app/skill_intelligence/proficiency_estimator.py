from typing import Dict, Any, List

class ProficiencyEstimator:
    """
    Estimates skill proficiency level (Beginner, Intermediate, Advanced, Expert)
    based on multi-factor evidence signals.
    """

    @classmethod
    def estimate_proficiency(
        cls,
        skill_name: str,
        context_text: str = "",
        experience_years: float = 0.0,
        mention_count: int = 1,
        has_certification: bool = False,
        has_project: bool = False
    ) -> Dict[str, Any]:
        
        score = 0.0

        # Factor 1: Experience Years
        if experience_years >= 5.0:
            score += 4.0
        elif experience_years >= 3.0:
            score += 3.0
        elif experience_years >= 1.0:
            score += 2.0
        else:
            score += 1.0

        # Factor 2: Mention Count / Frequency
        score += min(mention_count * 0.5, 2.0)

        # Factor 3: Certification Evidence
        if has_certification:
            score += 1.5

        # Factor 4: Project Evidence
        if has_project:
            score += 1.0

        # Factor 5: Contextual Keywords (Senior, Lead, Architect)
        lower_context = context_text.lower()
        if any(kw in lower_context for kw in ["senior", "lead", "architect", "principal", "expert"]):
            score += 1.5
        elif any(kw in lower_context for kw in ["junior", "intern", "beginner"]):
            score -= 1.0

        # Level Resolution
        if score >= 7.0:
            level = "Expert"
        elif score >= 5.0:
            level = "Advanced"
        elif score >= 3.0:
            level = "Intermediate"
        else:
            level = "Beginner"

        return {
            "level": level,
            # The level comes from fixed point rules; no confidence is measured for it
            "confidence": None,
            "evidence_score": round(min(score / 10.0, 1.0), 2)
        }
