import logging
from app.event_platform.event_registry import DomainEvent
from app.event_platform.subscriber import EventSubscriberRegistry
from app.event_platform.retry_handler import RetryHandler

logger = logging.getLogger("skillbridge-events")

class EventDispatcher:
    """
    Dispatches domain events to registered subscribers with retry and error handling.
    """

    def __init__(self, subscriber_registry: EventSubscriberRegistry, retry_handler: RetryHandler):
        self.subscriber_registry = subscriber_registry
        self.retry_handler = retry_handler

    def dispatch(self, event: DomainEvent):
        subscribers = self.subscriber_registry.get_subscribers_for_event(event.event_type)
        logger.info(f"EventDispatcher: dispatching [{event.event_type.value}] to {len(subscribers)} subscribers")
        for sub in subscribers:
            self.retry_handler.execute_with_retry(
                event=event,
                subscriber_name=sub.name,
                callback=sub.callback
            )
