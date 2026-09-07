import time
import logging
from typing import Callable, Dict, Any, List
from app.event_platform.event_registry import DomainEvent, EventType
from app.event_platform.event_store import EventStore
from app.event_platform.dead_letter_queue import DeadLetterQueue
from app.event_platform.retry_handler import RetryHandler
from app.event_platform.subscriber import EventSubscriberRegistry
from app.event_platform.event_dispatcher import EventDispatcher
from app.event_platform.publisher import EventPublisher
from app.event_platform.replay_manager import ReplayManager
from app.event_platform.metrics import EventMetricsCollector
from app.event_platform.health_monitor import EventHealthMonitor

logger = logging.getLogger("skillbridge-events")

class EventBus:
    """
    Central Event Bus & Streaming Platform Facade for SkillBridge.
    Enables asynchronous event-driven architecture, resilient workflows, and DLQ handling.
    """

    def __init__(self):
        self.event_store = EventStore()
        self.dlq = DeadLetterQueue()
        self.retry_handler = RetryHandler(self.dlq)
        self.subscriber_registry = EventSubscriberRegistry()
        self.dispatcher = EventDispatcher(self.subscriber_registry, self.retry_handler)
        self.publisher = EventPublisher(self.event_store)
        self.replay_manager = ReplayManager(self.event_store)
        self.metrics = EventMetricsCollector()
        self.health_monitor = EventHealthMonitor(self.dlq, self.event_store)

    def publish_event(self, event: DomainEvent):
        start = time.time()
        self.publisher.publish(event, self.dispatcher.dispatch)
        latency_ms = (time.time() - start) * 1000
        self.metrics.record_publish(latency_ms)

    def subscribe(self, subscriber_name: str, event_type: EventType, callback: Callable[[DomainEvent], None]):
        self.subscriber_registry.subscribe(subscriber_name, event_type, callback)

    def replay_correlation(self, correlation_id: str) -> int:
        return self.replay_manager.replay_correlation(correlation_id, self.dispatcher.dispatch)

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "metrics": self.metrics.get_metrics(),
            "health": self.health_monitor.get_health_status()
        }

# Global Event Bus Singleton Instance
event_bus_instance = EventBus()
