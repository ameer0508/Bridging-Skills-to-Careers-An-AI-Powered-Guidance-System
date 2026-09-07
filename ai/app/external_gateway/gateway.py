import time
import logging
from typing import Dict, Any, List, Optional
from app.external_gateway.provider_registry import registry_instance
from app.external_gateway.cache_manager import GatewayCacheManager
from app.external_gateway.retry_manager import RetryManager
from app.external_gateway.rate_limiter import RateLimiter
from app.external_gateway.sync_manager import SyncManager
from app.external_gateway.event_publisher import event_publisher_instance, GatewayEvent
from app.external_gateway.metrics import GatewayMetricsCollector
from app.external_gateway.health_monitor import GatewayHealthMonitor

logger = logging.getLogger("skillbridge-gateway")

class ExternalIntelligenceGateway:
    """
    Unified Enterprise External Intelligence Gateway Facade for SkillBridge.
    Single integration endpoint orchestrating Providers across Jobs, Salaries,
    Courses, Certifications, and Market Trends.
    """

    def __init__(self):
        self.registry = registry_instance
        self.cache = GatewayCacheManager()
        self.retry_manager = RetryManager()
        self.rate_limiter = RateLimiter()
        self.sync_manager = SyncManager()
        self.publisher = event_publisher_instance
        self.metrics = GatewayMetricsCollector()
        self.health_monitor = GatewayHealthMonitor()

    def fetch_domain_data(self, domain: str, query_params: Dict[str, Any]) -> Dict[str, Any]:
        domain_clean = domain.lower().strip()
        cache_key = f"gateway:{domain_clean}:{str(sorted(query_params.items()))}"

        cached = self.cache.get(cache_key)
        if cached:
            return cached

        start_time = time.time()
        providers = self.registry.get_providers_for_domain(domain_clean)
        results = []

        for p in providers:
            p_id = p.provider_id
            if not self.rate_limiter.is_allowed(p_id):
                logger.warning(f"Rate limit exceeded for [{p_id}], skipping.")
                continue

            try:
                def call_provider():
                    return p.fetch_data(query_params)

                data = self.retry_manager.execute_with_retry(p_id, call_provider)
                results.extend(data)
                self.health_monitor.record_provider_health(p_id, True, (time.time() - start_time) * 1000)
            except Exception as e:
                logger.error(f"Failed to fetch data from [{p_id}]: {e}")
                self.health_monitor.record_provider_health(p_id, False, (time.time() - start_time) * 1000)

        latency_ms = (time.time() - start_time) * 1000
        self.metrics.record_request(latency_ms, is_error=False)
        self.sync_manager.mark_synced(domain_clean)

        # Publish Gateway Event
        event_name_map = {
            "job": "JobUpdated",
            "salary": "SalaryUpdated",
            "course": "CourseUpdated",
            "certification": "CertificationUpdated",
            "market_trend": "TrendUpdated"
        }
        event_type = event_name_map.get(domain_clean, "DomainUpdated")
        self.publisher.publish(
            GatewayEvent(
                event_type=event_type,
                domain=domain_clean,
                payload={"items_fetched": len(results), "query": query_params}
            )
        )

        response = {
            "domain": domain_clean,
            "items_count": len(results),
            "data": results,
            "telemetry": {
                "latency_ms": round(latency_ms, 2),
                "cache": self.cache.get_stats(),
                "metrics": self.metrics.get_metrics(),
                "sync": self.sync_manager.get_sync_status(),
                "health": self.health_monitor.get_health_status()
            }
        }

        self.cache.set(cache_key, response, ttl_seconds=1800)
        return response

# Global Singleton Instance
gateway_instance = ExternalIntelligenceGateway()
