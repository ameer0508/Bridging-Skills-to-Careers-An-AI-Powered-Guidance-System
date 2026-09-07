import time
from typing import Dict, Any, Optional

class LinkedInCacheManager:
    """
    Caches LinkedIn profile analysis results with TTL invalidation.
    """

    def __init__(self, ttl_seconds: int = 86400):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl_seconds

    def get(self, profile_id: str) -> Optional[Dict[str, Any]]:
        record = self._cache.get(profile_id)
        if record and record["expire_at"] > time.time():
            return record["data"]
        return None

    def set(self, profile_id: str, data: Dict[str, Any]):
        self._cache[profile_id] = {
            "data": data,
            "expire_at": time.time() + self.ttl
        }
