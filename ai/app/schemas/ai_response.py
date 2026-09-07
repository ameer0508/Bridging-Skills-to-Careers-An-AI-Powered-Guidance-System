from typing import Any, List, Dict, Optional
from pydantic import BaseModel, Field

class TokenUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost_usd: float = 0.0

class UnifiedAIResponse(BaseModel):
    success: bool = True
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    provider: str = Field(default="gemini")
    latency: float = Field(default=0.0, description="Latency in milliseconds")
    model: str = Field(default="gemini-2.5-flash")
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
