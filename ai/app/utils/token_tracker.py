from app.schemas.ai_response import TokenUsage

class TokenTracker:
    """
    Estimates token counts for text prompts and completion outputs.
    Average rule of thumb: ~4 characters per token for English text.
    """
    @staticmethod
    def count_tokens(text: str) -> int:
        if not text:
            return 0
        # Combine word count and character count heuristic for robust estimation
        words = len(text.split())
        chars = len(text)
        return max(words, int(chars / 4.0))

    @classmethod
    def calculate_usage(cls, prompt: str, completion: str, estimated_cost: float = 0.0) -> TokenUsage:
        p_tokens = cls.count_tokens(prompt)
        c_tokens = cls.count_tokens(completion)
        t_tokens = p_tokens + c_tokens
        return TokenUsage(
            prompt_tokens=p_tokens,
            completion_tokens=c_tokens,
            total_tokens=t_tokens,
            estimated_cost_usd=round(estimated_cost, 6)
        )
