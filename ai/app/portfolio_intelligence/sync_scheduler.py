import time
import logging
from typing import Dict, Optional

logger = logging.getLogger("skillbridge-portfolio")

class PortfolioSyncScheduler:
    """
    Schedules periodic background syncs for portfolio websites.
    """

    def __init__(self):
        self._sync_log: Dict[str, float] = {}

    def record_sync(self, url: str):
        self._sync_log[url] = time.time()
        logger.info(f"PortfolioSyncScheduler: recorded background sync for [{url}]")

    def get_last_sync(self, url: str) -> Optional[float]:
        return self._sync_log.get(url)
