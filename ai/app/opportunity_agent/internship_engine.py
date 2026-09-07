from typing import List, Dict, Any

class InternshipEngine:
    """
    Discovers senior engineering internships, co-ops, & research residencies.
    """

    @staticmethod
    def get_internships() -> List[Dict[str, Any]]:
        return [
            {
                "internship_id": "int_res_01",
                "title": "Principal AI Infrastructure Research Resident",
                "company": "DataNexus Engine Corp",
                "monthly_stipend_usd": 14000
            }
        ]
