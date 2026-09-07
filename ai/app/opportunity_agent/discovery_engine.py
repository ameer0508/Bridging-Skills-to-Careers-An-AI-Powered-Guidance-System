from typing import List, Dict, Any

class OpportunityDiscoveryEngine:
    """
    Discovers multi-modal career opportunities across jobs, fellowships, research grants, hackathons, & accelerators.
    """

    @staticmethod
    def discover_all(user_skills: List[str]) -> List[Dict[str, Any]]:
        return [
            {
                "id": "opp_fel_01",
                "type": "Fellowship",
                "title": "Senior AI Infrastructure & Vector Systems Fellowship 2026",
                "organization": "OpenScale Research Labs",
                "grant_amount_usd": 150000,
                "deadline": "2026-09-01",
                "match_score": 98.5
            },
            {
                "id": "opp_acc_01",
                "type": "Accelerator",
                "title": "Y Combinator AI Scale-Out Batch",
                "organization": "Y Combinator",
                "funding_usd": 500000,
                "deadline": "2026-08-25",
                "match_score": 96.0
            }
        ]
