import time
from typing import Dict, Any, Optional

class PortfolioCacheManager:
    """
    Caches portfolio website analysis results with TTL invalidation.
    """

    def __init__(self, ttl_seconds: int = 86400):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_seconds

    def get(self, url: str) -> Optional[Dict[str, Any]]:
        record = self._cache.get(url)
        if record and record["expire_at"] > time.time():
            return record["data"]
        return None

    def set(self, url: str, data: Dict[str, Any]):
        self._cache[url] = {
            "data": data,
            "expire_at": time.time() + self.ttl
        }
