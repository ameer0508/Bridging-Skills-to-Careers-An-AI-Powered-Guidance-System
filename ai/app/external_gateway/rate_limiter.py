import time
import logging
from typing import Dict, Any

logger = logging.getLogger("skillbridge-gateway")

class RateLimiter:
    """
    Token bucket rate limiter & quota tracker per external provider.
    """

    def __init__(self, default_rate_per_sec: float = 10.0, default_burst: int = 20):
        self.default_rate = default_rate_per_sec
        self.default_burst = default_burst
        self._tokens: Dict[str, float] = {}
        self._last_update: Dict[str, float] = {}

    def is_allowed(self, provider_id: str) -> bool:
        now = time.time()
        if provider_id not in self._tokens:
            self._tokens[provider_id] = float(self.default_burst)
            self._last_update[provider_id] = now

        elapsed = now - self._last_update[provider_id]
        self._tokens[provider_id] = min(
            float(self.default_burst),
            self._tokens[provider_id] + elapsed * self.default_rate
        )
        self._last_update[provider_id] = now

        if self._tokens[provider_id] >= 1.0:
            self._tokens[provider_id] -= 1.0
            return True
        logger.warning(f"Rate limit exceeded for provider [{provider_id}]")
        return False
