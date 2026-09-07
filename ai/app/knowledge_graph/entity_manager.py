from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from app.knowledge_graph.ontology_manager import EntityType

class GraphNode(BaseModel):
    id: str
    name: str
    entity_type: EntityType
    properties: Dict[str, Any] = Field(default_factory=dict)

class EntityManager:
    """
    Manages node creation, indexing, and lookup in the Knowledge Graph.
    """

    def __init__(self):
        self._nodes: Dict[str, GraphNode] = {}

    def add_node(self, node_id: str, name: str, entity_type: EntityType, properties: Optional[Dict[str, Any]] = None) -> GraphNode:
        if properties is None:
            properties = {}
        node = GraphNode(id=node_id, name=name, entity_type=entity_type, properties=properties)
        self._nodes[node_id] = node
        return node

    def get_node(self, node_id: str) -> Optional[GraphNode]:
        return self._nodes.get(node_id)

    def find_nodes_by_type(self, entity_type: EntityType) -> List[GraphNode]:
        return [n for n in self._nodes.values() if n.entity_type == entity_type]

    def total_nodes(self) -> int:
        return len(self._nodes)
