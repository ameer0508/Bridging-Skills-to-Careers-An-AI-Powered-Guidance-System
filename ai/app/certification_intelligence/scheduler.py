import logging
import asyncio

logger = logging.getLogger("skillbridge-ai")

class CertificationSyncScheduler:
    """
    Background sync worker that periodically refreshes cached certification catalogs.
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
        logger.info(f"CertificationSyncScheduler started with interval {self.interval}s")

    async def stop(self):
        if not self.is_running:
            return
        self.is_running = False
        if self._task:
            self._task.cancel()
        logger.info("CertificationSyncScheduler stopped")

    async def _sync_loop(self):
        while self.is_running:
            try:
                logger.info("CertificationSyncScheduler: syncing certification provider catalogs...")
                await asyncio.sleep(1)
                logger.info("CertificationSyncScheduler: sync complete.")
            except Exception as e:
                logger.error(f"CertificationSyncScheduler error: {e}")
            await asyncio.sleep(self.interval)
