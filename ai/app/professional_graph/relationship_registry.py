import time
from enum import Enum
from typing import Dict, Any, Optional

class RelationshipType(str, Enum):
    HAS_SKILL = "HAS_SKILL"
    USES = "USES"
    BUILT = "BUILT"
    LEARNED = "LEARNED"
    EARNED = "EARNED"
    WORKED_AT = "WORKED_AT"
    VALIDATED_BY = "VALIDATED_BY"
    DEPENDS_ON = "DEPENDS_ON"
    LEADS_TO = "LEADS_TO"

class Edge:
    """
    Represents a directed edge between nodes in the Unified Professional Graph with rich evidence metadata.
    """

    def __init__(
        self,
        edge_id: str,
        source_id: str,
        target_id: str,
        rel_type: RelationshipType,
        confidence: float = 1.0,
        evidence: Optional[str] = None,
        verification_status: str = "Verified"
    ):
        self.edge_id = edge_id
        self.source_id = source_id
        self.target_id = target_id
        self.rel_type = rel_type
        self.confidence = confidence
        self.evidence = evidence or "System Direct Mapping"
        self.timestamp = time.time()
        self.verification_status = verification_status

    def to_dict(self) -> Dict[str, Any]:
        return {
            "edge_id": self.edge_id,
            "source_id": self.source_id,
            "target_id": self.target_id,
            "rel_type": self.rel_type.value,
            "confidence": self.confidence,
            "evidence": self.evidence,
            "timestamp": self.timestamp,
            "verification_status": self.verification_status
        }
