import time
import logging
from typing import Dict, Any

logger = logging.getLogger("skillbridge-ai")

class SalaryHealthMonitor:
    """
    Monitors health, quota utilization, error rates, and response latency for Salary Providers.
    """

    def __init__(self):
        self._provider_health: Dict[str, Dict[str, Any]] = {}

    def record_request(self, provider_name: str, latency_ms: float, success: bool):
        if provider_name not in self._provider_health:
            self._provider_health[provider_name] = {
                "total_requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
                "avg_latency_ms": 0.0,
                "status": "healthy",
                "last_checked": time.time(),
            }

        stats = self._provider_health[provider_name]
        stats["total_requests"] += 1
        if success:
            stats["successful_requests"] += 1
        else:
            stats["failed_requests"] += 1

        # Exponential moving average for latency
        current_avg = stats["avg_latency_ms"]
        stats["avg_latency_ms"] = round(0.8 * current_avg + 0.2 * latency_ms, 2) if current_avg > 0 else round(latency_ms, 2)

        error_rate = stats["failed_requests"] / stats["total_requests"]
        if error_rate > 0.5:
            stats["status"] = "degraded"
        else:
            stats["status"] = "healthy"

        stats["last_checked"] = time.time()

    def get_system_health(self) -> Dict[str, Any]:
        return {
            "overall_status": "healthy",
            "providers": self._provider_health
        }
