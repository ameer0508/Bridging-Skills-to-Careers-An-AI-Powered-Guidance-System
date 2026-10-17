from typing import Any, List, Dict
from app.schemas.ai_response import UnifiedAIResponse, TokenUsage
from app.utils.cost_tracker import CostTracker

class ResponseNormalizer:
    """
    Standardizes every AI response into UnifiedAIResponse envelope.
    """
    @staticmethod
    def _usage(provider: str, model: str, actual_usage: Dict[str, int] = None, model_invoked: bool = True) -> TokenUsage:
        if not model_invoked:
            # Rule-based and template pipelines: no model ran, so there are no tokens and no inference cost
            return TokenUsage(source="not_applicable", cost_basis=CostTracker.NOT_APPLICABLE)
        cost_basis = CostTracker.cost_basis(provider)
        if actual_usage and actual_usage.get("prompt_tokens") is not None:
            # Counts reported by the provider for this request
            p_tokens = int(actual_usage.get("prompt_tokens") or 0)
            c_tokens = int(actual_usage.get("completion_tokens") or 0)
            return TokenUsage(
                prompt_tokens=p_tokens,
                completion_tokens=c_tokens,
                total_tokens=p_tokens + c_tokens,
                estimated_cost_usd=round(CostTracker.calculate_cost(provider, model, p_tokens, c_tokens), 6),
                source="provider",
                cost_basis=cost_basis,
            )
        # The provider reported no counts: zeros labelled as unavailable, never an estimate from text length
        return TokenUsage(source="unavailable", cost_basis=cost_basis)

    @staticmethod
    def normalize_success(
        raw_data: Any,
        provider: str,
        model: str,
        latency_ms: float,
        prompt_text: str = "",
        completion_text: str = "",
        metadata: Dict[str, Any] = None,
        actual_usage: Dict[str, int] = None,
        model_invoked: bool = True
    ) -> UnifiedAIResponse:
        """model_invoked=False marks a deterministic result (no language model ran)."""
        if metadata is None:
            metadata = {}
        # Providers do not report a confidence for a reply, and none is estimated here
        metadata.setdefault("confidence_basis", "not_measured")
        if not model_invoked:
            metadata.setdefault("generation", "deterministic")

        return UnifiedAIResponse(
            success=True,
            confidence=None,
            provider=provider,
            latency=round(latency_ms, 2),
            model=model,
            usage=ResponseNormalizer._usage(provider, model, actual_usage, model_invoked),
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

        # A failed call reports no counts; none are estimated from the prompt
        usage = ResponseNormalizer._usage(provider, model)

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
