import time
import logging
from typing import Dict, Optional

logger = logging.getLogger("skillbridge-opensource")

class OpenSourceSyncScheduler:
    """
    Schedules background periodic syncs for open-source contributor profiles.
    """

    def __init__(self):
        self._sync_log: Dict[str, float] = {}

    def record_sync(self, username: str):
        self._sync_log[username] = time.time()
        logger.info(f"OpenSourceSyncScheduler: recorded background sync for [{username}]")

    def get_last_sync(self, username: str) -> Optional[float]:
        return self._sync_log.get(username)
