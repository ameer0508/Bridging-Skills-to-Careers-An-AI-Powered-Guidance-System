from typing import Dict, Any, Optional

class FeatureCache:
    """
    In-memory hot feature cache for ultra-low-latency model serving.
    """

    def __init__(self):
        self._cache: Dict[str, Any] = {}

    def get(self, key: str) -> Optional[Any]:
        return self._cache.get(key)

    def set(self, key: str, value: Any):
        self._cache[key] = value

    def clear(self):
        self._cache.clear()
