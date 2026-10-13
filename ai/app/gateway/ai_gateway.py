import os
import time
import logging
from typing import Dict, List, Any, Optional, Type
from pydantic import BaseModel
from app.config.ai_config import ai_config
from app.cost_policy import ProviderBlockedError, is_quota_error, runtime_policy
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
from app.observability import audit_log, categorize_failure

logger = logging.getLogger("skillbridge-ai")

# Services whose payload holds no personal information. Every other service, including any not
# listed here, is treated as carrying personal data and may only reach providers allowed to
# receive it (docs/ZERO_COST_API_POLICY.md, rule 7).
NON_PERSONAL_SERVICES = {"skill_normalization"}

# How long a provider that reported an exhausted quota is left alone
QUOTA_BACKOFF_SECONDS = 3600


def carries_personal_data(service_name: str) -> bool:
    return service_name not in NON_PERSONAL_SERVICES

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

    def get_provider_chain(
        self, requested_provider: Optional[str] = None, contains_personal_data: bool = True
    ) -> List[BaseAIProvider]:
        """
        Providers to try, in order. Only providers the zero-cost policy clears for this kind of
        data are included, so a configured key for a paid or unverified provider never puts it
        in the chain, and no paid provider can follow a free one that failed.
        """
        chain: List[BaseAIProvider] = []

        def usable(name: str) -> bool:
            provider = self.providers.get(name)
            return (
                provider is not None
                and provider not in chain
                and provider.is_available()
                and runtime_policy.check(name, contains_personal_data).allowed
            )

        # 1. Primary choice
        target = requested_provider or ai_config.primary_provider
        if usable(target):
            chain.append(self.providers[target])

        # 2. Fallbacks from config
        for p_name in ai_config.fallback_providers:
            if usable(p_name):
                chain.append(self.providers[p_name])

        # 3. Development mock fallback if nothing else is available
        if not chain and usable("mock"):
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
                audit_log.record("cache_hit", service_name, personal_data=carries_personal_data(service_name))
                return cached_resp

        # 2. Resolve Provider Fallback Chain
        personal = carries_personal_data(service_name)
        try:
            if personal:
                provider_chain = self.get_provider_chain(requested_provider)
            else:
                provider_chain = self.get_provider_chain(requested_provider, contains_personal_data=False)
        except RuntimeError:
            audit_log.record("no_provider", service_name, personal_data=personal, skipped=self._skip_reasons([], personal))
            raise
        audit_log.record("chain_resolved", service_name, personal_data=personal, skipped=self._skip_reasons(provider_chain, personal))
        errors: List[str] = []

        for idx, provider in enumerate(provider_chain):
            provider_name = provider.provider_name
            cfg = ai_config.providers.get(provider_name)
            rpm = cfg.rate_limit_rpm if cfg else 60

            # Cleared (and counted against its free quota) immediately before the call, whatever
            # put the provider in the chain
            try:
                runtime_policy.require(provider_name, contains_personal_data=personal)
            except ProviderBlockedError as blocked:
                logger.warning(f"[AI Gateway] {blocked}")
                audit_log.record("policy_refused", service_name, provider_name, reason=blocked.decision.reason.value, attempt=idx + 1, personal_data=personal)
                errors.append(f"{provider_name}: refused by the zero-cost policy ({blocked.decision.reason.value})")
                continue

            # 3. Rate Limit Check
            if not rate_limiter.check_rate_limit(provider_name, rpm):
                err_msg = f"Rate limit exceeded for provider '{provider_name}'"
                logger.warn(f"[AI Gateway] {err_msg}")
                audit_log.record("rate_limited", service_name, provider_name, attempt=idx + 1, personal_data=personal)
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

                call_started = time.time()
                response: UnifiedAIResponse = RetryManager.execute_with_retry(
                    _invoke,
                    max_retries=cfg.max_retries if cfg else 2
                )

                if response and response.success:
                    if fallback_used:
                        response.metadata["fallback_used"] = True
                    # X11: where the answer came from, so callers can label it honestly
                    response.metadata["observability"] = {
                        "provider": provider_name,
                        "attempt": idx + 1,
                        "fallbackUsed": fallback_used,
                        "testProvider": provider_name == "mock",
                    }
                    audit_log.record("success", service_name, provider_name, attempt=idx + 1,
                                     latency_ms=(time.time() - call_started) * 1000, personal_data=personal)
                    
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
                    err = runtime_policy.redact(response.errors[0] if response and response.errors else "Unknown provider failure")
                    logger.warning(f"[AI Gateway] Provider '{provider_name}' failed for service '{service_name}': {err}")
                    errors.append(f"{provider_name}: {err}")
                    self._record_failure(service_name, provider_name, err, idx + 1, personal)
                    self._note_quota_error(provider_name, err)

            except Exception as e:
                err_msg = runtime_policy.redact(f"{provider_name} Exception: {str(e)}")
                logger.error(f"[AI Gateway] {err_msg}")
                errors.append(err_msg)
                self._record_failure(service_name, provider_name, err_msg, idx + 1, personal)
                self._note_quota_error(provider_name, err_msg)

        total_latency = (time.time() - start_total) * 1000
        logger.error(f"[AI Gateway] All providers failed for service '{service_name}'. Errors: {errors}")
        audit_log.record("all_failed", service_name, personal_data=personal)
        
        return ResponseNormalizer.normalize_error(
            error_msg=f"All AI Providers failed: {'; '.join(errors)}",
            provider="gateway",
            model="none",
            latency_ms=total_latency,
            metadata={"all_errors": errors}
        )

    def record_unavailable(self, service_name: str, reason: str, chain: Optional[List[BaseAIProvider]] = None) -> None:
        """X11: a caller decided before routing that the feature cannot be served (e.g. only the test provider is allowed)."""
        personal = carries_personal_data(service_name)
        audit_log.record("no_provider", service_name, reason=reason, personal_data=personal, skipped=self._skip_reasons(chain or [], personal))

    def _skip_reasons(self, chain: List[BaseAIProvider], personal: bool) -> Dict[str, str]:
        """Why each registered provider is not in the chain: the policy's reason, or unavailable."""
        reasons: Dict[str, str] = {}
        for name, provider in self.providers.items():
            if provider in chain:
                continue
            decision = runtime_policy.check(name, personal)
            if not decision.allowed and decision.reason is not None:
                reasons[name] = decision.reason.value
            elif not provider.is_available():
                reasons[name] = "unavailable"
            else:
                reasons[name] = "not_configured_in_chain"
        return reasons

    @staticmethod
    def _record_failure(service_name: str, provider_name: str, message: str, attempt: int, personal: bool) -> None:
        """Only the failure category is recorded, never the message (it may echo user content)."""
        category = categorize_failure(message)
        audit_log.record("provider_failed", service_name, provider_name, reason=category, attempt=attempt, personal_data=personal)
        if category == "quota":
            audit_log.record("quota_paused", service_name, provider_name, personal_data=personal)

    @staticmethod
    def _note_quota_error(provider_name: str, message: str) -> None:
        """A provider that reports an exhausted free quota is not called again until it resets."""
        if is_quota_error(message):
            runtime_policy.mark_exhausted(provider_name, QUOTA_BACKOFF_SECONDS)
            logger.warning(f"[AI Gateway] '{provider_name}' reported an exhausted quota; paused for {QUOTA_BACKOFF_SECONDS}s, no fallback to paid providers.")

ai_gateway = AIGateway()
