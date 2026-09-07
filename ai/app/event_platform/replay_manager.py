import logging
from typing import List, Dict, Any, Callable
from app.event_platform.event_registry import DomainEvent, EventType
from app.event_platform.event_store import EventStore

logger = logging.getLogger("skillbridge-events")

class ReplayManager:
    """
    Replays historical events from the EventStore for auditing or recovering failed subscribers.
    """

    def __init__(self, event_store: EventStore):
        self.event_store = event_store

    def replay_correlation(self, correlation_id: str, dispatcher_callback: Callable[[DomainEvent], None]) -> int:
        records = self.event_store.get_events_by_correlation(correlation_id)
        replayed = 0
        for r in records:
            event = DomainEvent(
                event_id=r["event_id"],
                event_type=EventType(r["event_type"]),
                producer=r["producer"],
                payload=r["payload"],
                correlation_id=r["correlation_id"],
                timestamp=r["timestamp"]
            )
            dispatcher_callback(event)
            replayed += 1
        logger.info(f"Replayed {replayed} events for correlation_id [{correlation_id}]")
        return replayed
