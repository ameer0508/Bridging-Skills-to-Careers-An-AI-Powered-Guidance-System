from typing import Dict, Any, List
from app.professional_graph.entity_registry import Node, NodeType
from app.professional_graph.relationship_registry import Edge, RelationshipType

class GraphBuilder:
    """
    Constructs the Digital Twin Graph topology (Nodes + Edges) from user profile data.
    """

    @staticmethod
    def build_user_digital_twin(user_id: str, skills: List[str]) -> Dict[str, Any]:
        user_node = Node(f"usr_{user_id}", NodeType.USER, {"user_id": user_id, "name": "Digital Twin User"})
        
        nodes = [user_node.to_dict()]
        edges = []

        for idx, skill in enumerate(skills):
            sk_id = f"sk_{skill.lower()}"
            sk_node = Node(sk_id, NodeType.SKILL, {"name": skill, "category": "Core Engineering"})
            nodes.append(sk_node.to_dict())

            edge = Edge(
                edge_id=f"e_usr_sk_{idx}",
                source_id=user_node.node_id,
                target_id=sk_id,
                rel_type=RelationshipType.HAS_SKILL,
                confidence=0.98,
                evidence="Multi-Channel Corroborated Evidence"
            )
            edges.append(edge.to_dict())

        return {
            "user_id": user_id,
            "nodes_count": len(nodes),
            "edges_count": len(edges),
            "nodes": nodes,
            "edges": edges
        }
