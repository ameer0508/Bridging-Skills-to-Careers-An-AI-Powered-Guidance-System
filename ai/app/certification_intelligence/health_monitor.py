import time
import logging
from typing import Dict, Any

logger = logging.getLogger("skillbridge-ai")

class CertificationHealthMonitor:
    """
    Monitors request latencies, error rates, and health status across Certification Providers.
    """

    def __init__(self):
        self._health_stats: Dict[str, Dict[str, Any]] = {}

    def record_request(self, provider_name: str, latency_ms: float, success: bool):
        if provider_name not in self._health_stats:
            self._health_stats[provider_name] = {
                "total_requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
                "avg_latency_ms": 0.0,
                "status": "healthy",
                "last_checked": time.time(),
            }

        stats = self._health_stats[provider_name]
        stats["total_requests"] += 1
        if success:
            stats["successful_requests"] += 1
        else:
            stats["failed_requests"] += 1

        curr = stats["avg_latency_ms"]
        stats["avg_latency_ms"] = round(0.8 * curr + 0.2 * latency_ms, 2) if curr > 0 else round(latency_ms, 2)
        stats["last_checked"] = time.time()

    def get_system_health(self) -> Dict[str, Any]:
        return {
            "overall_status": "healthy",
            "providers": self._health_stats
        }
