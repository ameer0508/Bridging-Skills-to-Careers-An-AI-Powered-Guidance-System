import logging
from typing import Dict, Any, List, Callable
from pydantic import BaseModel

logger = logging.getLogger("skillbridge-gateway")

class GatewayEvent(BaseModel):
    event_type: str  # JobUpdated, SalaryUpdated, CourseUpdated, CertificationUpdated, TrendUpdated
    domain: str
    payload: Dict[str, Any]

class EventPublisher:
    """
    Event Bus for publishing and subscribing to external intelligence domain events.
    """

    def __init__(self):
        self._listeners: Dict[str, List[Callable[[GatewayEvent], None]]] = {}

    def subscribe(self, event_type: str, callback: Callable[[GatewayEvent], None]):
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(callback)
        logger.info(f"Subscribed callback to Gateway Event [{event_type}]")

    def publish(self, event: GatewayEvent):
        logger.info(f"Publishing Gateway Event [{event.event_type}] for domain [{event.domain}]")
        listeners = self._listeners.get(event.event_type, [])
        for cb in listeners:
            try:
                cb(event)
            except Exception as e:
                logger.error(f"Error handling event [{event.event_type}]: {e}")

# Global Event Publisher Instance
event_publisher_instance = EventPublisher()
