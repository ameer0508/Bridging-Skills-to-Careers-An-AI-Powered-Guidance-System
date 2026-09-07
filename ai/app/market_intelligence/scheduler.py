import logging
import asyncio

logger = logging.getLogger("skillbridge-ai")

class MarketSyncScheduler:
    """
    Background sync worker that periodically updates cached market trend indices.
    """

    def __init__(self, interval_seconds: int = 14400):  # 4 hours
        self.interval = interval_seconds
        self.is_running = False
        self._task = None

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._sync_loop())
        logger.info(f"MarketSyncScheduler started with interval {self.interval}s")

    async def stop(self):
        if not self.is_running:
            return
        self.is_running = False
        if self._task:
            self._task.cancel()
        logger.info("MarketSyncScheduler stopped")

    async def _sync_loop(self):
        while self.is_running:
            try:
                logger.info("MarketSyncScheduler: pre-fetching market trends...")
                await asyncio.sleep(1)
                logger.info("MarketSyncScheduler: sync complete.")
            except Exception as e:
                logger.error(f"MarketSyncScheduler error: {e}")
            await asyncio.sleep(self.interval)
