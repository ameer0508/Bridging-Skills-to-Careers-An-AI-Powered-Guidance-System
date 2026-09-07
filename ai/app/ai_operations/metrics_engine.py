import time
from typing import Dict, Any, List

class MetricsEngine:
    """
    Collects inference latency, token usage, model confidence, cache hit ratio, & request costs.
    """

    def __init__(self):
        self._total_requests = 0
        self._total_latency_ms = 0.0
        self._total_tokens = 0
        self._cache_hits = 0

    def record_inference(self, latency_ms: float, tokens: int = 150, confidence: float = 0.95, cached: bool = False):
        self._total_requests += 1
        self._total_latency_ms += latency_ms
        self._total_tokens += tokens
        if cached:
            self._cache_hits += 1

    def get_summary(self) -> Dict[str, Any]:
        avg_lat = (self._total_latency_ms / self._total_requests) if self._total_requests > 0 else 0.0
        hit_ratio = (self._cache_hits / self._total_requests * 100.0) if self._total_requests > 0 else 100.0
        return {
            "total_requests": self._total_requests,
            "average_latency_ms": round(avg_lat, 2),
            "total_tokens_consumed": self._total_tokens,
            "cache_hit_ratio_percent": round(hit_ratio, 1),
            "estimated_cost_usd": round(self._total_tokens * 0.000002, 4)
        }
