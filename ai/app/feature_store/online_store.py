import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("skillbridge-featurestore")

class OnlineStore:
    """
    In-memory low-latency Online Feature Store with TTL expiration for real-time AI serving.
    """

    def __init__(self, default_ttl_seconds: int = 3600):
        self._store: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl_seconds

    def write_features(self, entity_id: str, features: Dict[str, Any], ttl: Optional[int] = None):
        expire_at = time.time() + (ttl or self.default_ttl)
        if entity_id not in self._store:
            self._store[entity_id] = {}
        
        for k, v in features.items():
            self._store[entity_id][k] = {
                "value": v,
                "expire_at": expire_at
            }
        logger.debug(f"OnlineStore: wrote {len(features)} features for entity [{entity_id}]")

    def read_features(self, entity_id: str, feature_names: list) -> Dict[str, Any]:
        if entity_id not in self._store:
            return {}
        
        now = time.time()
        result = {}
        for fname in feature_names:
            rec = self._store[entity_id].get(fname)
            if rec and rec["expire_at"] > now:
                result[fname] = rec["value"]
        return result
