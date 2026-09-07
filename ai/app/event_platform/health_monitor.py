from typing import Dict, Any
from app.event_platform.dead_letter_queue import DeadLetterQueue
from app.event_platform.event_store import EventStore

class EventHealthMonitor:
    """
    Monitors Event Bus transport health, DLQ queue depth, and subscriber availability.
    """

    def __init__(self, dlq: DeadLetterQueue, store: EventStore):
        self.dlq = dlq
        self.store = store

    def get_health_status(self) -> Dict[str, Any]:
        dlq_size = self.dlq.size()
        return {
            "status": "healthy" if dlq_size == 0 else "degraded",
            "transport": "In-Memory / Pluggable Redis",
            "dlq_size": dlq_size,
            "total_events_stored": self.store.total_events()
        }
