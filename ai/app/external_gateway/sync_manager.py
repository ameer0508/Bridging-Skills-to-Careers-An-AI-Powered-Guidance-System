import time
import logging
from typing import Dict, Any

logger = logging.getLogger("skillbridge-gateway")

class SyncManager:
    """
    Tracks sync timestamps, incremental sync offsets, and last sync state for all domains.
    """

    def __init__(self):
        self._last_sync: Dict[str, float] = {}

    def mark_synced(self, domain: str):
        self._last_sync[domain.lower()] = time.time()
        logger.info(f"Marked domain [{domain}] synchronized at timestamp {self._last_sync[domain.lower()]}")

    def get_sync_status(self) -> Dict[str, Any]:
        return {
            domain: {
                "last_sync_timestamp": ts,
                "seconds_since_last_sync": round(time.time() - ts, 1)
            }
            for domain, ts in self._last_sync.items()
        }
