from typing import Dict, Tuple

class CostTracker:
    """
    Price matrix for tracking estimated USD cost per call across providers and models.
    Prices expressed per 1,000 tokens (prompt_cost, completion_cost).
    """
    PRICING_TABLE: Dict[str, Tuple[float, float]] = {
        # provider/model -> (prompt_price_per_1k, completion_price_per_1k)
        "gemini/gemini-2.5-flash": (0.000075, 0.000300),
        "gemini/gemini-1.5-pro": (0.001250, 0.005000),
        "openai/gpt-4o": (0.002500, 0.010000),
        "openai/gpt-4o-mini": (0.000150, 0.000600),
        "huggingface/mistralai/Mistral-7B-Instruct-v0.2": (0.000100, 0.000200),
        "local/llama3": (0.0, 0.0),
        "mock/mock-v1": (0.0, 0.0),
    }

    @classmethod
    def calculate_cost(cls, provider: str, model: str, prompt_tokens: int, completion_tokens: int) -> float:
        key = f"{provider}/{model}"
        pricing = cls.PRICING_TABLE.get(key, (0.0001, 0.0003))
        
        prompt_cost = (prompt_tokens / 1000.0) * pricing[0]
        completion_cost = (completion_tokens / 1000.0) * pricing[1]
        
        return round(prompt_cost + completion_cost, 6)
