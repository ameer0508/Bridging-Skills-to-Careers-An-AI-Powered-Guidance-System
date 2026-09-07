from typing import List, Dict, Any

class RegionalMarketAnalyzer:
    """
    Analyzes regional growth indices, remote hiring distributions, and location opportunity maps.
    """

    @staticmethod
    def get_regional_opportunity_indices() -> List[Dict[str, Any]]:
        return [
            {
                "region": "San Francisco Bay Area, CA",
                "country": "United States",
                "opportunity_index": 98.2,
                "remote_ratio": "45%",
                "top_demands": ["AI/ML", "Vector DBs", "Distributed Systems"]
            },
            {
                "region": "New York, NY",
                "country": "United States",
                "opportunity_index": 94.0,
                "remote_ratio": "52%",
                "top_demands": ["FinTech AI", "Quant Systems", "Cloud Ops"]
            },
            {
                "region": "Seattle, WA",
                "country": "United States",
                "opportunity_index": 92.5,
                "remote_ratio": "48%",
                "top_demands": ["AWS Cloud", "Azure Infra", "Kubernetes"]
            },
            {
                "region": "Global Remote",
                "country": "Worldwide",
                "opportunity_index": 96.0,
                "remote_ratio": "100%",
                "top_demands": ["Full-Stack TS", "FastAPI", "DevOps"]
            },
        ]
