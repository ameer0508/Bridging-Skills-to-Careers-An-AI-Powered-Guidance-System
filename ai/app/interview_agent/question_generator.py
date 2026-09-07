from typing import List, Dict, Any

class QuestionGenerator:
    """
    Generates company-specific & role-tailored interview questions across technical, behavioral, & system design categories.
    """

    @staticmethod
    def generate_questions(company: str, target_role: str) -> List[Dict[str, Any]]:
        return [
            {
                "question_id": "q_sys_01",
                "category": "System Design",
                "question": f"How would you architect a high-throughput vector search microservice handling 50M embeddings with sub-50ms latency for {company}?",
                "interviewer_intent": "Evaluate distributed vector indexing, HNSW trade-offs, & FastAPI concurrency.",
                "difficulty": "Hard"
            },
            {
                "question_id": "q_beh_01",
                "category": "Behavioral STAR",
                "question": "Describe a scenario where you resolved a critical latency bottleneck under tight deadline pressure.",
                "interviewer_intent": "Evaluate STAR structure, technical ownership, & stress resilience.",
                "difficulty": "Medium"
            }
        ]
