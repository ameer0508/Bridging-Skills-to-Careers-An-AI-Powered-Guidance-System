import time
from typing import Dict, List, Any

class IncidentManager:
    """
    Manages active platform incident records, severity levels (P1-P4), & auto-mitigations.
    """

    def __init__(self):
        self._incidents: List[Dict[str, Any]] = []

    def declare_incident(self, severity: str, title: str, component: str) -> Dict[str, Any]:
        inc = {
            "id": f"INC-{len(self._incidents)+101}",
            "severity": severity,
            "title": title,
            "component": component,
            "status": "OPEN",
            "created_at": time.time()
        }
        self._incidents.append(inc)
        return inc

    def list_active_incidents(self) -> List[Dict[str, Any]]:
        return [i for i in self._incidents if i["status"] == "OPEN"]
