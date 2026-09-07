import time
import logging
from typing import Dict, Optional

logger = logging.getLogger("skillbridge-coding")

class CodingSyncScheduler:
    """
    Schedules background periodic syncs for registered coding platform profiles.
    """

    def __init__(self):
        self._sync_log: Dict[str, float] = {}

    def record_sync(self, username: str):
        self._sync_log[username] = time.time()
        logger.info(f"CodingSyncScheduler: recorded background sync for [{username}]")

    def get_last_sync(self, username: str) -> Optional[float]:
        return self._sync_log.get(username)
