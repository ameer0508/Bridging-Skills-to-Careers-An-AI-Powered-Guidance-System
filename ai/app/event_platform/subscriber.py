import logging
from typing import Dict, List, Callable
from app.event_platform.event_registry import EventType, DomainEvent

logger = logging.getLogger("skillbridge-events")

class SubscriberRegistration:
    def __init__(self, name: str, event_type: EventType, callback: Callable[[DomainEvent], None]):
        self.name = name
        self.event_type = event_type
        self.callback = callback

class EventSubscriberRegistry:
    """
    Registry for service event subscriptions.
    """

    def __init__(self):
        self._subscriptions: Dict[EventType, List[SubscriberRegistration]] = {}

    def subscribe(self, name: str, event_type: EventType, callback: Callable[[DomainEvent], None]):
        if event_type not in self._subscriptions:
            self._subscriptions[event_type] = []
        sub = SubscriberRegistration(name=name, event_type=event_type, callback=callback)
        self._subscriptions[event_type].append(sub)
        logger.info(f"Registered subscriber [{name}] for event [{event_type.value}]")

    def get_subscribers_for_event(self, event_type: EventType) -> List[SubscriberRegistration]:
        return self._subscriptions.get(event_type, [])
