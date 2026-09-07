import time
import logging
from typing import Dict, Optional

logger = logging.getLogger("skillbridge-brand")

class BrandSyncScheduler:
    """
    Schedules background periodic syncs for professional branding profiles.
    """

    def __init__(self):
        self._sync_log: Dict[str, float] = {}

    def record_sync(self, user_id: str):
        self._sync_log[user_id] = time.time()
        logger.info(f"BrandSyncScheduler: recorded background sync for [{user_id}]")

    def get_last_sync(self, user_id: str) -> Optional[float]:
        return self._sync_log.get(user_id)
