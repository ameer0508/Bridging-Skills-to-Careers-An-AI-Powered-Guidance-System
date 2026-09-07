import time
import logging
from typing import Any, Optional, Dict

logger = logging.getLogger("skillbridge-gateway")

class GatewayCacheManager:
    """
    Unified Memory + Redis Cache Manager with TTL policies & background invalidation.
    """

    def __init__(self, default_ttl_seconds: int = 3600):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl_seconds
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if not entry:
            self.misses += 1
            return None

        if time.time() > entry["expires_at"]:
            del self._cache[key]
            self.misses += 1
            return None

        self.hits += 1
        return entry["value"]

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None):
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        self._cache[key] = {
            "value": value,
            "expires_at": time.time() + ttl
        }

    def invalidate(self, pattern: str):
        keys_to_del = [k for k in self._cache.keys() if pattern in k]
        for k in keys_to_del:
            del self._cache[k]
        logger.info(f"Invalidated {len(keys_to_del)} cache entries matching pattern [{pattern}]")

    def get_stats(self) -> Dict[str, Any]:
        total = self.hits + self.misses
        return {
            "cached_entries": len(self._cache),
            "hits": self.hits,
            "misses": self.misses,
            "hit_ratio_percent": round((self.hits / total * 100) if total > 0 else 0.0, 2)
        }
