from typing import Dict, Any, List

class GraphReasoner:
    """
    Executes graph reasoning: Infers hidden skills, predicts career transitions, & evaluates readiness.
    """

    @staticmethod
    def infer_hidden_skills(user_skills: List[str]) -> List[Dict[str, Any]]:
        inferred = []
        if "FastAPI" in user_skills and "Python" in user_skills:
            inferred.append({
                "inferred_skill": "ASGI / AsyncIO Concurrency",
                "reasoning": "Inferred from proven FastAPI & Python backend production experience.",
                "confidence": 0.95
            })
        if "Docker" in user_skills and "Kubernetes" in user_skills:
            inferred.append({
                "inferred_skill": "Cloud-Native Infrastructure",
                "reasoning": "Inferred from combined Docker containerization & Kubernetes orchestration.",
                "confidence": 0.96
            })
        return inferred
