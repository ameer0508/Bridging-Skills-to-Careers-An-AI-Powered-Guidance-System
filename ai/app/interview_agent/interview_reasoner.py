from typing import Dict, Any

class InterviewReasoner:
    """
    Synthesizes explainable AI rationale for question selection & evaluation scores.
    """

    @staticmethod
    def explain_evaluation(question_id: str) -> Dict[str, Any]:
        return {
            "question_id": question_id,
            "rationale": "Selected System Design HNSW challenge because OpenScale AI Systems evaluates scale-out vector database architecture during Round 2.",
            "evaluation_confidence": 0.985
        }
