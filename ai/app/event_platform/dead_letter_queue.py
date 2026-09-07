import logging
from typing import List, Dict, Any
from app.event_platform.event_registry import DomainEvent

logger = logging.getLogger("skillbridge-events")

class DeadLetterQueue:
    """
    Dead-Letter Queue (DLQ) capturing events that failed after maximum retry attempts.
    """

    def __init__(self):
        self._dlq: List[Dict[str, Any]] = []

    def enqueue(self, event: DomainEvent, subscriber_name: str, error_message: str):
        record = {
            "event": event.model_dump(),
            "subscriber": subscriber_name,
            "error": error_message,
            "failed_at": event.timestamp,
        }
        self._dlq.append(record)
        logger.error(f"DLQ Enqueued: Event [{event.event_id}] failed processing by subscriber [{subscriber_name}] - {error_message}")

    def list_dlq_events(self) -> List[Dict[str, Any]]:
        return self._dlq

    def size(self) -> int:
        return len(self._dlq)
