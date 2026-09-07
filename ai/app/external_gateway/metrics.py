import time
from typing import Dict, Any

class GatewayMetricsCollector:
    """
    Collects real-time telemetry metrics: request throughput, latencies, cache hit ratios, and error rates.
    """

    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.total_latency_ms = 0.0

    def record_request(self, latency_ms: float, is_error: bool = False):
        self.request_count += 1
        self.total_latency_ms += latency_ms
        if is_error:
            self.error_count += 1

    def get_metrics(self) -> Dict[str, Any]:
        avg_latency = (self.total_latency_ms / self.request_count) if self.request_count > 0 else 0.0
        error_rate = (self.error_count / self.request_count * 100) if self.request_count > 0 else 0.0
        return {
            "total_requests": self.request_count,
            "total_errors": self.error_count,
            "average_latency_ms": round(avg_latency, 2),
            "error_rate_percent": round(error_rate, 2),
        }
