import math
from typing import List, Dict, Any
from app.salary_intelligence.salary_provider import SalaryDataPoint

class SalaryAnalyticsResult(BaseModel if 'BaseModel' in globals() else object):
    pass

class SalaryAnalyzer:
    """
    Computes statistical percentiles, mean, median, experience breakdowns, skill premiums, and industry benchmarks.
    """

    @staticmethod
    def calculate_percentiles(values: List[float]) -> Dict[str, float]:
        if not values:
            return {"p10": 0, "p25": 0, "p50": 0, "p75": 0, "p90": 0}
        
        sorted_vals = sorted(values)
        n = len(sorted_vals)

        def get_p(p_val: float) -> float:
            k = (n - 1) * p_val
            f = math.floor(k)
            c = math.ceil(k)
            if f == c:
                return sorted_vals[int(k)]
            return sorted_vals[int(f)] * (c - k) + sorted_vals[int(c)] * (k - f)

        return {
            "p10": round(get_p(0.10), 2),
            "p25": round(get_p(0.25), 2),
            "p50": round(get_p(0.50), 2),
            "p75": round(get_p(0.75), 2),
            "p90": round(get_p(0.90), 2),
        }

    @classmethod
    def analyze_dataset(cls, points: List[SalaryDataPoint]) -> Dict[str, Any]:
        if not points:
            return {
                "count": 0,
                "median": 0,
                "mean": 0,
                "percentiles": {"p10": 0, "p25": 0, "p50": 0, "p75": 0, "p90": 0},
                "by_experience": {},
                "by_skill": {},
            }

        medians = [p.salary_median for p in points]
        avg_salary = sum(medians) / len(medians)
        percentiles = cls.calculate_percentiles(medians)

        # Experience breakdown
        exp_map: Dict[str, List[float]] = {}
        for p in points:
            exp_map.setdefault(p.experience_level, []).append(p.salary_median)

        by_experience = {
            exp: round(sum(vals) / len(vals), 2) for exp, vals in exp_map.items()
        }

        # Skill premiums
        skill_map: Dict[str, List[float]] = {}
        for p in points:
            for skill in p.required_skills:
                skill_map.setdefault(skill, []).append(p.salary_median)

        by_skill = {
            s: round(sum(vals) / len(vals), 2) for s, vals in skill_map.items()
        }

        return {
            "count": len(points),
            "median": percentiles["p50"],
            "mean": round(avg_salary, 2),
            "percentiles": percentiles,
            "by_experience": by_experience,
            "by_skill": by_skill,
        }
