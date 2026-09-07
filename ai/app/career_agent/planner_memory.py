import time
from typing import Dict, Any, List

class PlannerMemory:
    """
    Maintains persistent agent memory & decision trajectory across user interactions.
    """

    def __init__(self):
        self._memory: Dict[str, List[Dict[str, Any]]] = {}

    def log_decision(self, user_id: str, decision: str):
        if user_id not in self._memory:
            self._memory[user_id] = []
        self._memory[user_id].append({
            "timestamp": time.time(),
            "decision": decision
        })

    def get_history(self, user_id: str) -> List[Dict[str, Any]]:
        return self._memory.get(user_id, [])
