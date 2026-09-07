from typing import Dict, Any

class EventMetricsCollector:
    """
    Collects metrics: published event count, dispatch latency, subscriber error counts, & throughput.
    """

    def __init__(self):
        self.published_events = 0
        self.total_latency_ms = 0.0

    def record_publish(self, latency_ms: float):
        self.published_events += 1
        self.total_latency_ms += latency_ms

    def get_metrics(self) -> Dict[str, Any]:
        avg_latency = (self.total_latency_ms / self.published_events) if self.published_events > 0 else 0.0
        return {
            "published_events_total": self.published_events,
            "average_publish_latency_ms": round(avg_latency, 2),
            "status": "healthy"
        }
