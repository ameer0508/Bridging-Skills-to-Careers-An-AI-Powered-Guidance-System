import hashlib
import json
import time
from typing import Optional, Any, Dict
from app.schemas.ai_response import UnifiedAIResponse

class CacheEntry:
    def __init__(self, data: UnifiedAIResponse, ttl_seconds: int):
        self.data = data
        self.expires_at = time.time() + ttl_seconds

    def is_expired(self) -> bool:
        return time.time() > self.expires_at

class AICachingLayer:
    """
    In-memory async TTL cache for AI Gateway requests.
    """
    def __init__(self, default_ttl: int = 3600, max_entries: int = 1000):
        self._cache: Dict[str, CacheEntry] = {}
        self.default_ttl = default_ttl
        self.max_entries = max_entries

    def _hash_key(self, service_name: str, payload: Any) -> str:
        serialized = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(f"{service_name}:{serialized}".encode("utf-8")).hexdigest()

    def get(self, service_name: str, payload: Any) -> Optional[UnifiedAIResponse]:
        key = self._hash_key(service_name, payload)
        entry = self._cache.get(key)
        if entry:
            if entry.is_expired():
                del self._cache[key]
                return None
            # Return cached response with metadata mark
            cached_resp = entry.data.model_copy()
            cached_resp.metadata["cached"] = True
            return cached_resp
        return None

    def set(self, service_name: str, payload: Any, response: UnifiedAIResponse, ttl: Optional[int] = None) -> None:
        if not response.success:
            return  # Do not cache error responses
        
        if len(self._cache) >= self.max_entries:
            # Simple eviction of expired or oldest entry
            now = time.time()
            expired_keys = [k for k, v in self._cache.items() if v.expires_at < now]
            if expired_keys:
                for k in expired_keys:
                    del self._cache[k]
            else:
                # Evict first key
                first_key = next(iter(self._cache))
                del self._cache[first_key]

        key = self._hash_key(service_name, payload)
        effective_ttl = ttl if ttl is not None else self.default_ttl
        self._cache[key] = CacheEntry(response, effective_ttl)

    def clear(self) -> None:
        self._cache.clear()

ai_cache = AICachingLayer()
