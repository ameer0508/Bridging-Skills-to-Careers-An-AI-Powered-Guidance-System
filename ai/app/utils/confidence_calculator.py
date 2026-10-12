"""
Confidence for AI responses.

This module used to return a fixed number chosen by provider name (for example 0.98 for
Gemini). That was not a measurement of anything, so it has been removed: response envelopes
now carry `confidence = None` with `metadata["confidence_basis"] = "not_measured"`.

The class is kept so that any external caller fails soft instead of on import.
"""
from typing import Any, Optional


class ConfidenceCalculator:
    @staticmethod
    def calculate(raw_response: Any = None, provider: str = "", has_error: bool = False, fallback_used: bool = False) -> Optional[float]:
        """Always None: no confidence is measured."""
        return None
