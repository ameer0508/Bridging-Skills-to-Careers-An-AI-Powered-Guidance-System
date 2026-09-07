from typing import List, Dict, Any
from app.course_intelligence.provider_interface import CourseItem

class CourseRanker:
    """
    Multi-factor Course Ranking Engine.
    Scores courses using Skill Gap Fit (35%), Quality/Rating (25%), Market Alignment (20%),
    Certification Value (10%), and Learning Efficiency (10%).
    """

    @staticmethod
    def calculate_rank_score(
        course: CourseItem,
        target_skills: List[str],
        market_demand_map: Dict[str, float] = None
    ) -> Dict[str, Any]:
        if market_demand_map is None:
            market_demand_map = {}

        # 1. Skill Gap Fit (35%)
        overlap = [s for s in course.skills_taught if any(t.lower() in s.lower() for t in target_skills)]
        gap_fit_score = (len(overlap) / max(len(target_skills), 1)) * 100.0 if target_skills else 80.0
        gap_fit_score = min(100.0, gap_fit_score)

        # 2. Quality & Rating Score (25%)
        rating_score = (course.rating / 5.0) * 100.0

        # 3. Market Alignment (20%)
        market_score = 85.0
        if course.skills_taught:
            matches = [market_demand_map.get(s, 85.0) for s in course.skills_taught]
            market_score = sum(matches) / len(matches)

        # 4. Certification Value (10%)
        cert_score = 100.0 if course.certificate_available else 60.0

        # 5. Learning Efficiency Score (10%)
        efficiency_score = min(100.0, max(50.0, 100.0 - (course.duration_hours * 0.5)))

        # Weighted Final Score
        final_score = (
            (gap_fit_score * 0.35) +
            (rating_score * 0.25) +
            (market_score * 0.20) +
            (cert_score * 0.10) +
            (efficiency_score * 0.10)
        )

        return {
            "course": course.model_dump(),
            "final_rank_score": round(final_score, 1),
            "skill_gap_fit": round(gap_fit_score, 1),
            "rating_score": round(rating_score, 1),
            "market_alignment": round(market_score, 1),
            "certification_value": round(cert_score, 1),
            "learning_efficiency": round(efficiency_score, 1),
        }

    @classmethod
    def rank_courses(
        cls,
        courses: List[CourseItem],
        target_skills: List[str]
    ) -> List[Dict[str, Any]]:
        ranked = [cls.calculate_rank_score(c, target_skills) for c in courses]
        ranked.sort(key=lambda x: x["final_rank_score"], reverse=True)
        return ranked
