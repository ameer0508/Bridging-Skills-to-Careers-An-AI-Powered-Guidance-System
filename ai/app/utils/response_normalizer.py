from typing import Any, List, Dict
from app.schemas.ai_response import UnifiedAIResponse, TokenUsage
from app.utils.token_tracker import TokenTracker
from app.utils.cost_tracker import CostTracker

class ResponseNormalizer:
    """
    Standardizes every AI response into UnifiedAIResponse envelope.
    """
    @staticmethod
    def normalize_success(
        raw_data: Any,
        provider: str,
        model: str,
        latency_ms: float,
        prompt_text: str = "",
        completion_text: str = "",
        metadata: Dict[str, Any] = None,
        actual_usage: Dict[str, int] = None
    ) -> UnifiedAIResponse:
        if metadata is None:
            metadata = {}
        # Providers do not report a confidence for a reply, and none is estimated here
        metadata.setdefault("confidence_basis", "not_measured")

        if not completion_text and isinstance(raw_data, str):
            completion_text = raw_data
        elif not completion_text and raw_data is not None:
            completion_text = str(raw_data)

        if actual_usage and actual_usage.get("prompt_tokens") is not None:
            # Counts reported by the provider for this request
            p_tokens = int(actual_usage.get("prompt_tokens") or 0)
            c_tokens = int(actual_usage.get("completion_tokens") or 0)
            cost = CostTracker.calculate_cost(provider, model, p_tokens, c_tokens)
            usage = TokenUsage(
                prompt_tokens=p_tokens,
                completion_tokens=c_tokens,
                total_tokens=p_tokens + c_tokens,
                estimated_cost_usd=round(cost, 6),
                source="provider",
            )
        else:
            p_tokens = TokenTracker.count_tokens(prompt_text)
            c_tokens = TokenTracker.count_tokens(completion_text)
            cost = CostTracker.calculate_cost(provider, model, p_tokens, c_tokens)
            usage = TokenTracker.calculate_usage(prompt_text, completion_text, cost)

        return UnifiedAIResponse(
            success=True,
            confidence=None,
            provider=provider,
            latency=round(latency_ms, 2),
            model=model,
            usage=usage,
            response=raw_data,
            data=raw_data,
            errors=[],
            metadata=metadata
        )

    @staticmethod
    def normalize_error(
        error_msg: str,
        provider: str,
        model: str,
        latency_ms: float,
        prompt_text: str = "",
        metadata: Dict[str, Any] = None
    ) -> UnifiedAIResponse:
        if metadata is None:
            metadata = {}

        p_tokens = TokenTracker.count_tokens(prompt_text)
        usage = TokenUsage(prompt_tokens=p_tokens, completion_tokens=0, total_tokens=p_tokens, estimated_cost_usd=0.0)

        return UnifiedAIResponse(
            success=False,
            confidence=None,
            provider=provider,
            latency=round(latency_ms, 2),
            model=model,
            usage=usage,
            response=None,
            data=None,
            errors=[error_msg],
            metadata=metadata
        )
