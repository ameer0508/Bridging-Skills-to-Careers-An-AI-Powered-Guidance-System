from typing import List, Dict, Any

class TechnicalEngine:
    """
    Generates deep technical questions on framework internals, concurrency models, & database indexing.
    """

    @staticmethod
    def generate_technical_questions(target_skill: str) -> List[Dict[str, Any]]:
        return [
            {
                "question_id": "q_tech_01",
                "topic": target_skill,
                "question": f"Explain the memory & recall trade-offs between HNSW graph indexes and IVF-PQ quantization in {target_skill}.",
                "expected_key_concepts": ["Graph Connectivity", "Product Quantization Loss", "Recall vs Latency Curve"]
            }
        ]
