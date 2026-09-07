import time
from typing import Dict, Any, Optional

class CodingCacheManager:
    """
    Caches competitive coding analysis results across platforms with TTL invalidation.
    """

    def __init__(self, ttl_seconds: int = 86400):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_seconds

    def get(self, username: str) -> Optional[Dict[str, Any]]:
        record = self._cache.get(username)
        if record and record["expire_at"] > time.time():
            return record["data"]
        return None

    def set(self, username: str, data: Dict[str, Any]):
        self._cache[username] = {
            "data": data,
            "expire_at": time.time() + self.ttl
        }
