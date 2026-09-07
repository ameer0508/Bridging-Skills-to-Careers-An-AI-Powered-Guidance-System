import time
from typing import Dict, Any, List

class OfflineStore:
    """
    Historical snapshot store for longitudinal feature analytics, model training datasets, and evaluation.
    """

    def __init__(self):
        self._history: List[Dict[str, Any]] = []

    def append_snapshot(self, entity_id: str, features: Dict[str, Any]):
        snapshot = {
            "entity_id": entity_id,
            "timestamp": time.time(),
            "features": features
        }
        self._history.append(snapshot)

    def get_entity_history(self, entity_id: str) -> List[Dict[str, Any]]:
        return [s for s in self._history if s["entity_id"] == entity_id]
