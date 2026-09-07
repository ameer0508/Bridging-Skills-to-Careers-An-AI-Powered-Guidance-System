import asyncio
import time
import logging
from typing import Callable, Any, TypeVar, List

logger = logging.getLogger("skillbridge-ai")
T = TypeVar("T")

class RetryManager:
    """
    Handles exponential backoff retries for transient errors.
    """
    @staticmethod
    def execute_with_retry(
        func: Callable[..., T],
        *args: Any,
        max_retries: int = 3,
        initial_delay: float = 0.5,
        backoff_factor: float = 2.0,
        retryable_exceptions: List[type] = None,
        **kwargs: Any
    ) -> T:
        if retryable_exceptions is None:
            retryable_exceptions = [Exception]

        delay = initial_delay
        last_exception = None

        for attempt in range(1, max_retries + 1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                # Check if exception type matches
                if not any(isinstance(e, ex_type) for ex_type in retryable_exceptions):
                    raise e

                logger.warn(
                    f"Attempt {attempt}/{max_retries} failed with error: {e}. Retrying in {delay:.2f}s..."
                )
                if attempt == max_retries:
                    break
                time.sleep(delay)
                delay *= backoff_factor

        raise last_exception if last_exception else RuntimeError("Retry attempts exhausted")

    @staticmethod
    async def execute_async_with_retry(
        async_func: Callable[..., Any],
        *args: Any,
        max_retries: int = 3,
        initial_delay: float = 0.5,
        backoff_factor: float = 2.0,
        retryable_exceptions: List[type] = None,
        **kwargs: Any
    ) -> Any:
        if retryable_exceptions is None:
            retryable_exceptions = [Exception]

        delay = initial_delay
        last_exception = None

        for attempt in range(1, max_retries + 1):
            try:
                return await async_func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                if not any(isinstance(e, ex_type) for ex_type in retryable_exceptions):
                    raise e

                logger.warn(
                    f"Async attempt {attempt}/{max_retries} failed with error: {e}. Retrying in {delay:.2f}s..."
                )
                if attempt == max_retries:
                    break
                await asyncio.sleep(delay)
                delay *= backoff_factor

        raise last_exception if last_exception else RuntimeError("Async retry attempts exhausted")
