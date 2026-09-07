import logging
from typing import Dict, List, Any, Optional
from app.event_platform.event_registry import DomainEvent

logger = logging.getLogger("skillbridge-events")

class EventStoreRecord(BaseModel if False else object):
    pass

class EventStore:
    """
    Persists published domain events for audit logging, debugging, and event replay.
    """

    def __init__(self):
        self._store: List[Dict[str, Any]] = []

    def append_event(self, event: DomainEvent, status: str = "PUBLISHED", consumer: Optional[str] = None):
        record = {
            "event_id": event.event_id,
            "event_type": event.event_type.value if hasattr(event.event_type, "value") else str(event.event_type),
            "producer": event.producer,
            "consumer": consumer or "ALL",
            "status": status,
            "correlation_id": event.correlation_id,
            "timestamp": event.timestamp,
            "payload": event.payload,
        }
        self._store.append(record)
        logger.debug(f"EventStore: persisted event [{event.event_id}] ({event.event_type})")

    def get_events_by_correlation(self, correlation_id: str) -> List[Dict[str, Any]]:
        return [e for e in self._store if e["correlation_id"] == correlation_id]

    def get_all_events(self) -> List[Dict[str, Any]]:
        return self._store

    def total_events(self) -> int:
        return len(self._store)
