from typing import List, Dict, Any

class FellowshipEngine:
    """
    Discovers prestigious industry & academic research fellowships.
    """

    @staticmethod
    def get_fellowships() -> List[Dict[str, Any]]:
        return [
            {
                "fellowship_id": "fel_openai_01",
                "title": "OpenScale Senior AI Engineering Fellowship",
                "stipend_usd": 180000,
                "duration": "12 Months"
            }
        ]
