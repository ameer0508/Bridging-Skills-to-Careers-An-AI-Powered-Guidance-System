import logging
from typing import Dict, Any

logger = logging.getLogger("skillbridge-orchestrator")

class AuditLogger:
    """
    Logs immutable audit events for agent executions & human-in-the-loop approval actions.
    """

    @staticmethod
    def log_event(user_id: str, action: str, details: Dict[str, Any]):
        logger.info(f"AuditLogger: [{action}] for [{user_id}] - Details: {details}")
        return {
            "user_id": user_id,
            "action": action,
            "status": "AUDITED"
        }
