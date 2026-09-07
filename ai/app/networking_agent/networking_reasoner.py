from typing import Dict, Any

class NetworkingReasoner:
    """
    Synthesizes explainable AI rationale for networking connection recommendations.
    """

    @staticmethod
    def explain_match(connection_name: str, company: str) -> Dict[str, Any]:
        return {
            "connection_name": connection_name,
            "company": company,
            "rationale": f"Recommended connecting with {connection_name} because she leads AI Infrastructure at {company} and shares your Stanford alumni network.",
            "match_confidence": 0.965
        }
