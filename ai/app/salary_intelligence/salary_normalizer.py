import logging
from typing import List
from app.salary_intelligence.salary_provider import SalaryDataPoint

logger = logging.getLogger("skillbridge-ai")

# Static Currency Conversion Rates to USD
CURRENCY_RATES = {
    "USD": 1.0,
    "EUR": 1.08,
    "GBP": 1.27,
    "CAD": 0.74,
    "AUD": 0.65,
    "INR": 0.012,
}

class SalaryNormalizer:
    """
    Normalizes currency, payment periods, titles, experience levels, and removes duplicate data points.
    """

    @staticmethod
    def normalize_currency(amount: float, currency: str) -> float:
        rate = CURRENCY_RATES.get(currency.upper(), 1.0)
        return round(amount * rate, 2)

    @staticmethod
    def normalize_period_to_annual(amount: float, period: str) -> float:
        p = period.lower()
        if p in ["hour", "hourly"]:
            return amount * 2080  # 40 hrs/wk * 52 wks
        if p in ["month", "monthly"]:
            return amount * 12
        return amount  # Default annual

    @staticmethod
    def normalize_experience_level(level: str) -> str:
        lvl = level.lower()
        if any(w in lvl for w in ["entry", "junior", "associate", "intern"]):
            return "Junior"
        if any(w in lvl for w in ["staff", "principal", "director", "vp"]):
            return "Principal"
        if any(w in lvl for w in ["lead", "manager", "head"]):
            return "Lead"
        if "senior" in lvl or "sr" in lvl:
            return "Senior"
        return "Mid"

    @classmethod
    def normalize_point(cls, point: SalaryDataPoint) -> SalaryDataPoint:
        norm_min = cls.normalize_currency(point.salary_min, point.currency)
        norm_max = cls.normalize_currency(point.salary_max, point.currency)
        norm_med = cls.normalize_currency(point.salary_median, point.currency)

        point.salary_min = norm_min
        point.salary_max = norm_max
        point.salary_median = norm_med
        point.currency = "USD"
        point.experience_level = cls.normalize_experience_level(point.experience_level)
        return point

    @classmethod
    def deduplicate_and_normalize(cls, points: List[SalaryDataPoint]) -> List[SalaryDataPoint]:
        seen = set()
        normalized_list = []
        for p in points:
            norm_p = cls.normalize_point(p)
            key = (norm_p.normalized_title.lower(), norm_p.company.lower(), norm_p.location.lower(), norm_p.salary_median)
            if key not in seen:
                seen.add(key)
                normalized_list.append(norm_p)
        return normalized_list
