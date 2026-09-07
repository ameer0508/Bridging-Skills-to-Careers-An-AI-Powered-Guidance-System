from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from app.knowledge_graph.ontology_manager import RelationshipType

class GraphEdge(BaseModel):
    source_id: str
    target_id: str
    rel_type: RelationshipType
    weight: float = 1.0
    properties: Dict[str, Any] = Field(default_factory=dict)

class RelationshipManager:
    """
    Manages directed weighted edges and adjacency indexing for graph traversal.
    """

    def __init__(self):
        self._edges: List[GraphEdge] = []
        self._adjacency: Dict[str, List[GraphEdge]] = {}

    def add_edge(
        self,
        source_id: str,
        target_id: str,
        rel_type: RelationshipType,
        weight: float = 1.0,
        properties: Optional[Dict[str, Any]] = None
    ) -> GraphEdge:
        if properties is None:
            properties = {}
        edge = GraphEdge(
            source_id=source_id,
            target_id=target_id,
            rel_type=rel_type,
            weight=weight,
            properties=properties
        )
        self._edges.append(edge)

        if source_id not in self._adjacency:
            self._adjacency[source_id] = []
        self._adjacency[source_id].append(edge)
        return edge

    def get_outgoing_edges(self, source_id: str) -> List[GraphEdge]:
        return self._adjacency.get(source_id, [])

    def total_edges(self) -> int:
        return len(self._edges)
