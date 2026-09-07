from typing import List, Dict, Any

class StartupProgramEngine:
    """
    Discovers startup accelerators, venture seed programs, & founder grants.
    """

    @staticmethod
    def get_startup_programs() -> List[Dict[str, Any]]:
        return [
            {
                "program_id": "prog_yc_01",
                "name": "Y Combinator AI Scale-Out Batch W26",
                "funding_usd": 500000,
                "location": "San Francisco, CA"
            }
        ]
