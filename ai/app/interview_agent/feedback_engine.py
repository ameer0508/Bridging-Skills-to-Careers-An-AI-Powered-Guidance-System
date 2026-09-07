from typing import Dict, Any, List

class FeedbackEngine:
    """
    Generates actionable candidate feedback, missing key points, & ideal sample responses.
    """

    @staticmethod
    def generate_feedback(evaluation: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "strengths": evaluation.get("key_strengths", []),
            "areas_to_improve": ["Mention failure domain isolation across multi-region deployments"],
            "ideal_response_summary": "I would partition HNSW graphs into distributed shards and place a lightweight cache layer in front of vector lookups."
        }
