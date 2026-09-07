import time
import logging
from typing import Dict, List, Any

logger = logging.getLogger("skillbridge-audit")

class AuditLogger:
    """
    Persists immutable audit log records for AI predictions, recommendations, & configuration edits.
    """

    def __init__(self):
        self._audit_logs: List[Dict[str, Any]] = []

    def log_action(self, action: str, actor: str, details: Dict[str, Any]):
        record = {
            "action": action,
            "actor": actor,
            "details": details,
            "timestamp": time.time()
        }
        self._audit_logs.append(record)
        logger.info(f"AuditLogger: [{actor}] performed [{action}]")

    def get_logs(self) -> List[Dict[str, Any]]:
        return self._audit_logs
