import logging
import asyncio
from typing import List

logger = logging.getLogger("skillbridge-ai")

class SalarySyncScheduler:
    """
    Background sync worker that periodically updates cached market salary indices.
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
        logger.info(f"SalarySyncScheduler started with interval {self.interval}s")

    async def stop(self):
        if not self.is_running:
            return
        self.is_running = False
        if self._task:
            self._task.cancel()
        logger.info("SalarySyncScheduler stopped")

    async def _sync_loop(self):
        while self.is_running:
            try:
                logger.info("SalarySyncScheduler: pre-fetching market salary indices...")
                # Simulate background refresh of top tech role indices
                await asyncio.sleep(1)
                logger.info("SalarySyncScheduler: sync complete.")
            except Exception as e:
                logger.error(f"SalarySyncScheduler error: {e}")
            await asyncio.sleep(self.interval)
