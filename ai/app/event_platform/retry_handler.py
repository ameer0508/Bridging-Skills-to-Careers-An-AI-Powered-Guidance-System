import time
import logging
from typing import Callable, Any
from app.event_platform.event_registry import DomainEvent
from app.event_platform.dead_letter_queue import DeadLetterQueue

logger = logging.getLogger("skillbridge-events")

class RetryHandler:
    """
    Executes subscriber callbacks with exponential backoff before sending to Dead-Letter Queue.
    """

    def __init__(self, dlq: DeadLetterQueue, max_retries: int = 3, backoff_factor: float = 1.5):
        self.dlq = dlq
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor

    def execute_with_retry(
        self,
        event: DomainEvent,
        subscriber_name: str,
        callback: Callable[[DomainEvent], None]
    ):
        attempt = 0
        delay = 0.1
        while attempt < self.max_retries:
            try:
                callback(event)
                return
            except Exception as e:
                attempt += 1
                logger.warning(f"Subscriber [{subscriber_name}] attempt {attempt}/{self.max_retries} failed for event [{event.event_id}]: {e}")
                if attempt >= self.max_retries:
                    self.dlq.enqueue(event, subscriber_name, str(e))
                    return
                time.sleep(delay)
                delay *= self.backoff_factor
