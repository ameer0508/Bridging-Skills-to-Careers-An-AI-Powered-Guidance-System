import time
from typing import Dict, Any

class GatewayHealthMonitor:
    """
    Monitors overall health, domain status, availability, latency, and quota metrics across all external providers.
    """

    def __init__(self):
        self._provider_health: Dict[str, Dict[str, Any]] = {}

    def record_provider_health(self, provider_id: str, is_available: bool, latency_ms: float):
        self._provider_health[provider_id] = {
            "is_available": is_available,
            "latency_ms": round(latency_ms, 2),
            "last_checked": time.time(),
            "status": "healthy" if is_available else "degraded"
        }

    def get_health_status(self) -> Dict[str, Any]:
        all_healthy = all(p.get("is_available", True) for p in self._provider_health.values())
        return {
            "status": "healthy" if all_healthy else "degraded",
            "provider_health": self._provider_health
        }
