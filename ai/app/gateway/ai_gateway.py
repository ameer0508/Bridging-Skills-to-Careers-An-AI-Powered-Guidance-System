import os
import time
import logging
from typing import Dict, List, Any, Optional, Type
from pydantic import BaseModel
from app.config.ai_config import ai_config
from app.providers.base_provider import BaseAIProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.openai_adapter import OpenAIAdapter
from app.providers.huggingface_adapter import HuggingFaceAdapter
from app.providers.local_adapter import LocalModelAdapter
from app.providers.mock_adapter import MockProvider
from app.schemas.ai_response import UnifiedAIResponse
from app.utils.caching_layer import ai_cache
from app.utils.rate_limiter import rate_limiter
from app.utils.retry_manager import RetryManager
from app.utils.response_normalizer import ResponseNormalizer

logger = logging.getLogger("skillbridge-ai")

class AIGateway:
    """
    Enterprise AI Gateway for SkillBridge Intelligence Layer.
    Handles dynamic provider routing, fallback chains, caching, rate limiting, retries, and metrics logging.
    """

    def __init__(self):
        self.providers: Dict[str, BaseAIProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        self.providers["gemini"] = GeminiProvider()
        self.providers["openai"] = OpenAIAdapter()
        self.providers["huggingface"] = HuggingFaceAdapter()
        self.providers["local"] = LocalModelAdapter()

        # Mock provider is initialized ONLY if enabled (strictly disabled in production)
        if ai_config.enable_mock_provider:
            self.providers["mock"] = MockProvider()

        logger.info(f"AI Gateway initialized with registered providers: {list(self.providers.keys())}")

    def get_provider_chain(self, requested_provider: Optional[str] = None) -> List[BaseAIProvider]:
        chain: List[BaseAIProvider] = []
        
        # 1. Primary choice
        target = requested_provider or ai_config.primary_provider
        if target in self.providers and self.providers[target].is_available():
            chain.append(self.providers[target])

        # 2. Fallbacks from config
        for p_name in ai_config.fallback_providers:
            if p_name in self.providers and self.providers[p_name] not in chain and self.providers[p_name].is_available():
                chain.append(self.providers[p_name])

        # 3. Development mock fallback if nothing else is available
        if not chain and "mock" in self.providers and self.providers["mock"].is_available():
            chain.append(self.providers["mock"])

        if not chain:
            raise RuntimeError("No AI providers available. Please check environment configuration and API keys.")

        return chain

    def route_request(
        self,
        service_name: str,
        method_name: str,
        payload: Any,
        schema_class: Optional[Type[BaseModel]] = None,
        requested_provider: Optional[str] = None,
        use_cache: bool = True,
        **kwargs
    ) -> UnifiedAIResponse:
        start_total = time.time()

        # 1. Check Caching Layer
        if use_cache:
            cached_resp = ai_cache.get(service_name, payload)
            if cached_resp:
                logger.info(f"[AI Gateway] Cache HIT for service '{service_name}'")
                return cached_resp

        # 2. Resolve Provider Fallback Chain
        provider_chain = self.get_provider_chain(requested_provider)
        errors: List[str] = []

        for idx, provider in enumerate(provider_chain):
            provider_name = provider.provider_name
            cfg = ai_config.providers.get(provider_name)
            rpm = cfg.rate_limit_rpm if cfg else 60

            # 3. Rate Limit Check
            if not rate_limiter.check_rate_limit(provider_name, rpm):
                err_msg = f"Rate limit exceeded for provider '{provider_name}'"
                logger.warn(f"[AI Gateway] {err_msg}")
                errors.append(err_msg)
                continue

            fallback_used = (idx > 0)
            logger.info(f"[AI Gateway] Routing service '{service_name}' to provider '{provider_name}' (fallback_used={fallback_used})")

            try:
                # Execute with Retry Manager
                def _invoke():
                    target_func = getattr(provider, method_name)
                    if isinstance(payload, dict):
                        call_kwargs = dict(payload)
                        if schema_class:
                            call_kwargs["schema_class"] = schema_class
                        return target_func(**call_kwargs)
                    else:
                        if schema_class:
                            return target_func(payload, schema_class)
                        else:
                            return target_func(payload)

                response: UnifiedAIResponse = RetryManager.execute_with_retry(
                    _invoke,
                    max_retries=cfg.max_retries if cfg else 2
                )

                if response and response.success:
                    if fallback_used:
                        response.metadata["fallback_used"] = True
                    
                    # Log Metrics
                    logger.info(
                        f"[AI Gateway Metric] Service={service_name} | Provider={response.provider} | Model={response.model} | "
                        f"Latency={response.latency}ms | Tokens={response.usage.total_tokens} | Cost=${response.usage.estimated_cost_usd:.6f}"
                    )

                    # Store in Caching Layer
                    if use_cache:
                        ai_cache.set(service_name, payload, response)

                    return response
                else:
                    err = response.errors[0] if response and response.errors else "Unknown provider failure"
                    logger.warn(f"[AI Gateway] Provider '{provider_name}' failed for service '{service_name}': {err}")
                    errors.append(f"{provider_name}: {err}")

            except Exception as e:
                err_msg = f"{provider_name} Exception: {str(e)}"
                logger.error(f"[AI Gateway] {err_msg}")
                errors.append(err_msg)

        total_latency = (time.time() - start_total) * 1000
        logger.error(f"[AI Gateway] All providers failed for service '{service_name}'. Errors: {errors}")
        
        return ResponseNormalizer.normalize_error(
            error_msg=f"All AI Providers failed: {'; '.join(errors)}",
            provider="gateway",
            model="none",
            latency_ms=total_latency,
            metadata={"all_errors": errors}
        )

ai_gateway = AIGateway()
