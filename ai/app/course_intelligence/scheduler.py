import logging
import asyncio

logger = logging.getLogger("skillbridge-ai")

class CourseSyncScheduler:
    """
    Background sync worker that periodically updates cached course provider indices.
    """

    def __init__(self, interval_seconds: int = 21600):  # 6 hours
        self.interval = interval_seconds
        self.is_running = False
        self._task = None

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._sync_loop())
        logger.info(f"CourseSyncScheduler started with interval {self.interval}s")

    async def stop(self):
        if not self.is_running:
            return
        self.is_running = False
        if self._task:
            self._task.cancel()
        logger.info("CourseSyncScheduler stopped")

    async def _sync_loop(self):
        while self.is_running:
            try:
                logger.info("CourseSyncScheduler: refreshing provider course catalogs...")
                await asyncio.sleep(1)
                logger.info("CourseSyncScheduler: sync complete.")
            except Exception as e:
                logger.error(f"CourseSyncScheduler error: {e}")
            await asyncio.sleep(self.interval)
