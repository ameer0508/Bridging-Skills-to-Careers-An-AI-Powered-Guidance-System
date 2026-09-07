import time
import logging
from typing import Callable, Any, Dict

logger = logging.getLogger("skillbridge-gateway")

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_time_sec: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_time = recovery_time_sec
        self.failure_count = 0
        self.state = "CLOSED"  # CLOSED, OPEN, HALF-OPEN
        self.last_state_change = time.time()

    def record_failure(self):
        self.failure_count += 1
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            self.last_state_change = time.time()
            logger.warning(f"Circuit Breaker opened due to {self.failure_count} consecutive failures")

    def record_success(self):
        self.failure_count = 0
        self.state = "CLOSED"

    def can_execute(self) -> bool:
        if self.state == "CLOSED":
            return True
        if self.state == "OPEN":
            if time.time() - self.last_state_change > self.recovery_time:
                self.state = "HALF-OPEN"
                return True
            return False
        return True  # HALF-OPEN allows one probe request

class RetryManager:
    """
    Executes calls with exponential backoff, circuit breaker protection, and fallback provider routing.
    """

    def __init__(self):
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}

    def get_circuit_breaker(self, provider_id: str) -> CircuitBreaker:
        if provider_id not in self.circuit_breakers:
            self.circuit_breakers[provider_id] = CircuitBreaker()
        return self.circuit_breakers[provider_id]

    def execute_with_retry(
        self,
        provider_id: str,
        func: Callable[[], Any],
        max_retries: int = 3,
        backoff_factor: float = 1.5
    ) -> Any:
        cb = self.get_circuit_breaker(provider_id)
        if not cb.can_execute():
            raise RuntimeError(f"Circuit breaker for provider [{provider_id}] is OPEN.")

        attempt = 0
        delay = 0.5
        while attempt < max_retries:
            try:
                res = func()
                cb.record_success()
                return res
            except Exception as e:
                attempt += 1
                cb.record_failure()
                logger.error(f"Provider [{provider_id}] attempt {attempt}/{max_retries} failed: {e}")
                if attempt >= max_retries:
                    raise e
                time.sleep(delay)
                delay *= backoff_factor
