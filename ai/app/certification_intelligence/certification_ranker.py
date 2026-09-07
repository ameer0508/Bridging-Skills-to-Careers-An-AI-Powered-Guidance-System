from typing import List, Dict, Any
from app.certification_intelligence.provider_interface import CertificationItem

class CertificationRanker:
    """
    Multi-Factor Certification Ranking Engine.
    Scores certifications using Skill Gap Fit (35%), Employer Recognition (25%),
    Salary Impact (20%), ROI Score (10%), and Level Alignment (10%).
    """

    @staticmethod
    def calculate_rank_score(
        cert: CertificationItem,
        target_skills: List[str]
    ) -> Dict[str, Any]:
        # 1. Skill Gap Fit (35%)
        overlap = [s for s in cert.skills_covered if any(t.lower() in s.lower() for t in target_skills)]
        gap_fit_score = (len(overlap) / max(len(target_skills), 1)) * 100.0 if target_skills else 85.0
        gap_fit_score = min(100.0, gap_fit_score)

        # 2. Employer Recognition (25%)
        recognition_score = cert.employer_recognition_score

        # 3. Salary Premium Impact (20%)
        salary_score = min(100.0, (cert.salary_boost_usd / 25000.0) * 100.0)

        # 4. ROI Score (10%)
        annual_gain = cert.salary_boost_usd
        cost = max(cert.exam_cost_usd, 50.0)
        payback_months = (cost / (annual_gain / 12.0))
        roi_score = min(100.0, max(50.0, 100.0 - (payback_months * 20.0)))

        # 5. Level Fit (10%)
        level_score = 90.0

        # Final Weighted Score
        final_score = (
            (gap_fit_score * 0.35) +
            (recognition_score * 0.25) +
            (salary_score * 0.20) +
            (roi_score * 0.10) +
            (level_score * 0.10)
        )

        return {
            "certification": cert.model_dump(),
            "final_rank_score": round(final_score, 1),
            "skill_gap_fit": round(gap_fit_score, 1),
            "employer_recognition": round(recognition_score, 1),
            "salary_impact_score": round(salary_score, 1),
            "roi_score": round(roi_score, 1),
            "payback_months": round(payback_months, 1)
        }

    @classmethod
    def rank_certifications(
        cls,
        certs: List[CertificationItem],
        target_skills: List[str]
    ) -> List[Dict[str, Any]]:
        ranked = [cls.calculate_rank_score(c, target_skills) for c in certs]
        ranked.sort(key=lambda x: x["final_rank_score"], reverse=True)
        return ranked
