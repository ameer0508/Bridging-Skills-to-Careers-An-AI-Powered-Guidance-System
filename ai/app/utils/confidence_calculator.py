from typing import Any, Dict

class ConfidenceCalculator:
    """
    Calculates normalized confidence score (0.0 to 1.0) for AI responses.
    """
    @staticmethod
    def calculate(
        raw_response: Any,
        provider: str,
        has_error: bool = False,
        fallback_used: bool = False
    ) -> float:
        if has_error:
            return 0.0
        
        base_confidence = 0.95
        
        # Provider signal modifiers
        if provider == "mock":
            base_confidence = 0.85
        elif provider == "local":
            base_confidence = 0.90
        elif provider == "gemini" or provider == "openai":
            base_confidence = 0.98
        elif provider == "huggingface":
            base_confidence = 0.92

        if fallback_used:
            base_confidence -= 0.10

        # Output completeness modifiers
        if raw_response is None:
            return 0.0
        
        if isinstance(raw_response, str) and not raw_response.strip():
            return 0.0

        if isinstance(raw_response, dict):
            if not raw_response:
                return 0.50
            # Check ratio of non-empty values
            total_keys = len(raw_response)
            non_empty = sum(1 for v in raw_response.values() if v is not None and v != [] and v != "")
            completeness = non_empty / max(total_keys, 1)
            base_confidence = base_confidence * (0.5 + 0.5 * completeness)

        return round(max(0.0, min(1.0, base_confidence)), 2)
