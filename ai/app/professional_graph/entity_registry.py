from enum import Enum
from typing import Dict, Any, Optional

class NodeType(str, Enum):
    USER = "User"
    SKILL = "Skill"
    PROJECT = "Project"
    REPOSITORY = "Repository"
    CERTIFICATION = "Certification"
    COURSE = "Course"
    EXPERIENCE = "Experience"
    COMPANY = "Company"
    TECHNOLOGY = "Technology"
    JOB = "Job"
    CAREER = "Career"
    ROADMAP = "Roadmap"

class Node:
    """
    Represents a vertex node in the Unified Professional Graph.
    """

    def __init__(self, node_id: str, label: NodeType, properties: Optional[Dict[str, Any]] = None):
        self.node_id = node_id
        self.label = label
        self.properties = properties or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "label": self.label.value,
            "properties": self.properties
        }
