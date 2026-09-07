from typing import Dict, Any

class SalaryNegotiationEngine:
    """
    Calculates compensation benchmarks & recommended counter-offer strategies based on market intelligence.
    """

    @staticmethod
    def get_negotiation_strategy(base_offer_usd: float) -> Dict[str, Any]:
        counter_offer = round(base_offer_usd * 1.12, -3)
        return {
            "base_offer_usd": base_offer_usd,
            "target_counter_offer_usd": counter_offer,
            "market_percentile": "75th Percentile Senior/Principal Tier",
            "negotiation_leverage": "HIGH (Multiple Active Top 1% Offers)"
        }
