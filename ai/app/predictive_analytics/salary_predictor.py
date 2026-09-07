"""
Salary Predictor Module for Predictive Analytics & Career Intelligence Engine.
Predicts current & projected salary ranges based on verified skill entities, certifications, and target role.
"""

from typing import List, Dict, Any


class SalaryPredictor:
    """
    Computes baseline vs skill-boosted compensation potential.
    """

    BASE_ROLE_SALARIES: Dict[str, Dict[str, int]] = {
        "ai": {"min": 115000, "median": 145000, "max": 185000},
        "backend": {"min": 95000, "median": 125000, "max": 160000},
        "fullstack": {"min": 90000, "median": 120000, "max": 155000},
        "cloud": {"min": 105000, "median": 135000, "max": 170000},
        "cybersecurity": {"min": 100000, "median": 130000, "max": 165000},
        "default": {"min": 85000, "median": 110000, "max": 140000}
    }

    def predict_salary(
        self,
        target_role: str,
        user_skills: List[str] = None,
        certifications: List[str] = None
    ) -> Dict[str, Any]:
        """
        Estimates baseline, projected, and skill-boosted salary ranges.
        """
        role_norm = target_role.lower()
        matched_key = "default"

        for k in self.BASE_ROLE_SALARIES:
            if k in role_norm:
                matched_key = k
                break

        base = self.BASE_ROLE_SALARIES[matched_key]

        # Skill density boost (+1.5% per verified skill entity, max 30%)
        skill_count = len(user_skills or [])
        skill_multiplier = 1.0 + min(0.30, skill_count * 0.015)

        # Certification boost (+5% per recognized cert)
        cert_count = len(certifications or [])
        cert_multiplier = 1.0 + min(0.15, cert_count * 0.05)

        projected_median = int(base["median"] * skill_multiplier * cert_multiplier)
        projected_max = int(base["max"] * skill_multiplier * cert_multiplier)
        potential_increase = projected_median - base["median"]

        return {
            "baseline_median": base["median"],
            "baseline_range": f"${base['min']:,} - ${base['max']:,}",
            "projected_median": projected_median,
            "projected_range": f"${int(base['min'] * skill_multiplier):,} - ${projected_max:,}",
            "potential_salary_increase": potential_increase,
            "currency": "USD"
        }
