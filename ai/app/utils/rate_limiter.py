import time
import threading
from typing import Dict

class TokenBucket:
    def __init__(self, rpm: int):
        self.capacity = rpm
        self.tokens = float(rpm)
        self.fill_rate = rpm / 60.0  # tokens per second
        self.last_update = time.time()
        self.lock = threading.Lock()

    def consume(self, tokens: int = 1) -> bool:
        with self.lock:
            now = time.time()
            elapsed = now - self.last_update
            self.tokens = min(float(self.capacity), self.tokens + elapsed * self.fill_rate)
            self.last_update = now

            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False

class ProviderRateLimiter:
    """
    Sliding window token bucket rate limiter for provider protection.
    """
    def __init__(self):
        self.buckets: Dict[str, TokenBucket] = {}
        self.lock = threading.Lock()

    def get_bucket(self, provider_name: str, rpm: int = 60) -> TokenBucket:
        with self.lock:
            if provider_name not in self.buckets:
                self.buckets[provider_name] = TokenBucket(rpm)
            return self.buckets[provider_name]

    def check_rate_limit(self, provider_name: str, rpm: int = 60) -> bool:
        bucket = self.get_bucket(provider_name, rpm)
        return bucket.consume(1)

rate_limiter = ProviderRateLimiter()
