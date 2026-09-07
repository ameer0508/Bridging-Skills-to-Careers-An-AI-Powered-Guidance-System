import asyncio
import logging
from typing import Callable, Any

logger = logging.getLogger("skillbridge-gateway")

class RequestScheduler:
    """
    Schedules background batch updates and periodic asynchronous data polling tasks.
    """

    def __init__(self):
        self._tasks = []

    async def schedule_periodic(self, interval_sec: float, func: Callable[[], Any]):
        async def _loop():
            while True:
                try:
                    await func()
                except Exception as e:
                    logger.error(f"Scheduled task error: {e}")
                await asyncio.sleep(interval_sec)

        task = asyncio.create_task(_loop())
        self._tasks.append(task)
        logger.info(f"Scheduled periodic task every {interval_sec} seconds")
