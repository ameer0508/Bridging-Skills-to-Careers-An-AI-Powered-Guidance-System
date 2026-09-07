from typing import List, Dict, Any

class TechnologyDetector:
    """
    Detects frontend frameworks (React, Next.js, Vue), backend tech (FastAPI, Python), & cloud stacks.
    """

    @staticmethod
    def detect_technologies(projects: List[Dict[str, Any]]) -> Dict[str, Any]:
        tech_set = set()
        for p in projects:
            tech_set.update(p.get("tech_stack", []))

        return {
            "detected_technologies": list(tech_set),
            "primary_frontend_framework": "Next.js / React",
            "primary_backend_framework": "FastAPI / Python",
            "technology_breadth_score": min(98.0, len(tech_set) * 14.0)
        }
