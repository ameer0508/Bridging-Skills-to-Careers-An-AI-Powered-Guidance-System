from typing import Dict, Any

class ConfidenceEngine:
    """
    Computes statistical confidence scores (0.0 - 1.0) for graph relationships.
    """

    @staticmethod
    def calculate_confidence(source_channel: str, corroboration_count: int) -> float:
        base = 0.70
        if source_channel in ["GitHub", "Portfolio"]:
            base = 0.90
        return min(0.99, base + (corroboration_count * 0.04))
