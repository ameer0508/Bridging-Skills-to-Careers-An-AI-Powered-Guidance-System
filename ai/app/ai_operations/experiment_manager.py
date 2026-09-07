import random
from typing import Dict, Any, List

class ExperimentManager:
    """
    Manages live A/B experiments, model variant traffic splitting, and offline evaluations.
    """

    def __init__(self):
        self._experiments: Dict[str, Dict[str, Any]] = {
            "exp-career-matching-v2": {
                "variant_a": "Gemini-2.5-Flash",
                "variant_b": "Gemini-1.5-Pro",
                "traffic_split_a": 0.5
            }
        }

    def assign_variant(self, experiment_id: str, user_id: str) -> str:
        exp = self._experiments.get(experiment_id)
        if not exp:
            return "variant_a"
        
        # Consistent hash variant assignment
        h = hash(user_id) % 100
        return "variant_a" if h < (exp["traffic_split_a"] * 100) else "variant_b"
