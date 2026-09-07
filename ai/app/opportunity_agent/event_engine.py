from typing import List, Dict, Any

class EventEngine:
    """
    Discovers global tech summits, workshops, & open calls.
    """

    @staticmethod
    def get_events() -> List[Dict[str, Any]]:
        return [
            {
                "event_id": "evt_summit_01",
                "title": "Global Vector Search & Scale-Out Infrastructure Summit 2026",
                "date": "2026-09-15"
            }
        ]
