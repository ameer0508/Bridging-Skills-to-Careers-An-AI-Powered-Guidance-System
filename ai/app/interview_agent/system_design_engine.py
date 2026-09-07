from typing import Dict, Any

class SystemDesignEngine:
    """
    Generates distributed system design scenarios & whiteboard architecture challenges.
    """

    @staticmethod
    def generate_system_design_scenario(company: str) -> Dict[str, Any]:
        return {
            "scenario_id": "sys_des_50M",
            "company": company,
            "title": f"Design a Real-Time 50M Vector Embedding Search & Recommendation Platform for {company}",
            "core_requirements": [
                "Sub-50ms p99 latency",
                "High availability across 3 regions",
                "Support 100,000 writes/sec with real-time index sync"
            ]
        }
