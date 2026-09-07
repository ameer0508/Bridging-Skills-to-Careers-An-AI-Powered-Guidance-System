import logging
from app.event_platform.event_registry import DomainEvent
from app.event_platform.event_store import EventStore

logger = logging.getLogger("skillbridge-events")

class EventPublisher:
    """
    Publishes domain events to the Event Bus transport & appends to EventStore.
    """

    def __init__(self, event_store: EventStore):
        self.event_store = event_store

    def publish(self, event: DomainEvent, dispatch_fn):
        logger.info(f"EventPublisher: publishing [{event.event_type.value}] from producer [{event.producer}]")
        self.event_store.append_event(event, status="PUBLISHED")
        dispatch_fn(event)
