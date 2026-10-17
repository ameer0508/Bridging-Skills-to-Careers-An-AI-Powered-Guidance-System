from typing import Any, List, Dict, Optional
from pydantic import BaseModel, Field

class TokenUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost_usd: float = 0.0
    # How the token counts were obtained:
    #   "provider"       - reported by the model runtime for this request (a reported 0 is a real 0)
    #   "unavailable"    - a model ran, or was attempted, but reported no counts; the zeros are not measurements
    #   "not_applicable" - no language model was invoked (rule-based or template pipeline)
    # Counts are never estimated from text length.
    source: str = "unavailable"
    # Why estimated_cost_usd has its value (see CostTracker). Nothing is priced from an invented rate.
    cost_basis: str = "unpriced"

class UnifiedAIResponse(BaseModel):
    success: bool = True
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Estimate reported by an AI model when one produced this value. None when no confidence was measured, which is always the case for the rule-based parser.")
    provider: str = Field(default="unknown")
    latency: float = Field(default=0.0, description="Latency in milliseconds")
    model: str = Field(default="unknown")
    usage: TokenUsage = Field(default_factory=TokenUsage)
    response: Any = None
    data: Any = None  # Alias for backward compatibility
    errors: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def model_post_init(self, __context: Any) -> None:
        # Sync response and data if one is set but not the other
        if self.data is None and self.response is not None:
            self.data = self.response
        elif self.response is None and self.data is not None:
            self.response = self.data
