import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("skillbridge-github")

class GitHubSyncScheduler:
    """
    Schedules background periodic syncs for registered GitHub profiles.
    """

    def __init__(self):
        self._sync_log: Dict[str, float] = {}

    def record_sync(self, username: str):
        self._sync_log[username] = time.time()
        logger.info(f"GitHubSyncScheduler: recorded background sync for [{username}]")

    def get_last_sync(self, username: str) -> Optional[float]:
        return self._sync_log.get(username)
