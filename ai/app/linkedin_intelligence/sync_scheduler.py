import time
import logging
from typing import Dict, Optional

logger = logging.getLogger("skillbridge-linkedin")

class LinkedInSyncScheduler:
    """
    Schedules background periodic syncs for registered LinkedIn profiles.
    """

    def __init__(self):
        self._sync_log: Dict[str, float] = {}

    def record_sync(self, profile_id: str):
        self._sync_log[profile_id] = time.time()
        logger.info(f"LinkedInSyncScheduler: recorded background sync for [{profile_id}]")

    def get_last_sync(self, profile_id: str) -> Optional[float]:
        return self._sync_log.get(profile_id)
