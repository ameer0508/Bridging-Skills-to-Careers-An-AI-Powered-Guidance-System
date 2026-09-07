from typing import Dict, Any

class ProfileReconciler:
    """
    Reconciles duplicate entities (e.g. 'FastAPI', 'fastapi-framework') into unified graph node canonical names.
    """

    @staticmethod
    def normalize_skill(name: str) -> str:
        s = name.strip().lower()
        mapping = {
            "fastapi": "FastAPI",
            "fast-api": "FastAPI",
            "k8s": "Kubernetes",
            "kubernetes": "Kubernetes",
            "reactjs": "React",
            "react": "React",
            "python3": "Python",
            "python": "Python"
        }
        return mapping.get(s, name.capitalize())
