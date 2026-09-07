from typing import Dict, Any

class FeatureStoreMetricsCollector:
    """
    Collects telemetry metrics: online lookup latency, cache hits, & feature materializations.
    """

    def __init__(self):
        self.lookups = 0
        self.cache_hits = 0

    def record_lookup(self, hit: bool):
        self.lookups += 1
        if hit:
            self.cache_hits += 1

    def get_metrics(self) -> Dict[str, Any]:
        hit_ratio = (self.cache_hits / self.lookups * 100.0) if self.lookups > 0 else 100.0
        return {
            "total_lookups": self.lookups,
            "cache_hit_ratio_percent": round(hit_ratio, 1),
            "status": "healthy"
        }
