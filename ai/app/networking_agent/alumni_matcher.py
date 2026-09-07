from typing import List, Dict, Any

class AlumniMatcher:
    """
    Identifies university & bootcamp alumni working at target companies.
    """

    @staticmethod
    def find_alumni(company: str) -> List[Dict[str, Any]]:
        return [
            {
                "alumni_id": "alum_77",
                "name": "Marcus Vance",
                "role": "Staff Engineer",
                "company": company,
                "alma_mater": "Stanford University",
                "graduation_year": 2021
            }
        ]
