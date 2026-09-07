from typing import List, Dict, Any

class BehavioralEngine:
    """
    Generates STAR-structured behavioral questions targeting leadership, technical ownership, & conflict resolution.
    """

    @staticmethod
    def generate_behavioral_questions() -> List[Dict[str, Any]]:
        return [
            {
                "question_id": "q_beh_star_01",
                "question": "Tell me about a time you disagreed with an architectural decision made by a senior staff engineer. How did you handle it?",
                "rubric": "Evaluates data-driven persuasion, professional diplomacy, & consensus building."
            }
        ]
