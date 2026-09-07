from typing import Dict, Any, List

# Regional Cost-of-Living Multipliers (Base: US National Average 1.0)
REGIONAL_COL_INDEX = {
    "San Francisco, CA": {"col_multiplier": 1.65, "ppp_ratio": 1.0},
    "New York, NY": {"col_multiplier": 1.58, "ppp_ratio": 1.0},
    "Seattle, WA": {"col_multiplier": 1.35, "ppp_ratio": 1.0},
    "Austin, TX": {"col_multiplier": 1.15, "ppp_ratio": 1.0},
    "London, UK": {"col_multiplier": 1.30, "ppp_ratio": 0.85},
    "Toronto, Canada": {"col_multiplier": 1.10, "ppp_ratio": 0.88},
    "Remote / Global": {"col_multiplier": 1.05, "ppp_ratio": 1.0},
    "National Average": {"col_multiplier": 1.00, "ppp_ratio": 1.0},
}

class RegionalComparator:
    """
    Compares salaries across geographic regions adjusting for Cost of Living (COL) & Purchasing Power Parity (PPP).
    """

    @staticmethod
    def compare_regions(base_salary_usd: float) -> List[Dict[str, Any]]:
        comparison = []
        for region, data in REGIONAL_COL_INDEX.items():
            adj_salary = round(base_salary_usd * data["col_multiplier"], 2)
            real_purchasing_power = round(adj_salary / data["col_multiplier"], 2)

            comparison.append({
                "region": region,
                "nominal_salary_usd": adj_salary,
                "col_index_multiplier": data["col_multiplier"],
                "ppp_adjusted_salary_usd": real_purchasing_power,
                "living_cost_tier": "High" if data["col_multiplier"] >= 1.3 else "Moderate" if data["col_multiplier"] >= 1.1 else "Standard"
            })

        comparison.sort(key=lambda x: x["nominal_salary_usd"], reverse=True)
        return comparison
