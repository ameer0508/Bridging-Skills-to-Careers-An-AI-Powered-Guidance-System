class CostTracker:
    """
    The AI inference cost reported for a call, with the reason for it.

    SkillBridge runs under a zero-cost policy (app/cost_policy/provider_registry.json): local models
    cost nothing, and the only external model it may call (Gemini) is allowed solely on a free tier
    the operator has attested has no billing linked. No price table is applied, so no monetary
    figure is invented for a provider or model.
    """
    # Run on this machine: nothing is billed, whatever the model
    LOCAL_PROVIDERS = {"local", "mock"}
    # Allowed only on an attested free tier with no billing linked (runtime_policy enforces it)
    FREE_TIER_PROVIDERS = {"gemini"}

    NO_CHARGE_LOCAL = "no_charge_local"
    NO_CHARGE_FREE_TIER = "no_charge_free_tier"
    NOT_APPLICABLE = "not_applicable"
    # No price is known for the provider: the reported 0 is NOT a verified cost. The zero-cost
    # policy blocks every such provider, so this is only seen on failures and unknown names.
    UNPRICED = "unpriced"

    @classmethod
    def cost_basis(cls, provider: str) -> str:
        if provider in cls.LOCAL_PROVIDERS:
            return cls.NO_CHARGE_LOCAL
        if provider in cls.FREE_TIER_PROVIDERS:
            return cls.NO_CHARGE_FREE_TIER
        return cls.UNPRICED

    @classmethod
    def calculate_cost(cls, provider: str, model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """Always 0.0. Only a no_charge_* basis means the call is known to be free; with "unpriced" the 0 is a placeholder."""
        return 0.0
