from typing import List, Dict, Any
from app.knowledge_graph.entity_manager import EntityManager
from app.knowledge_graph.relationship_manager import RelationshipManager
from app.knowledge_graph.ontology_manager import RelationshipType

class InferenceEngine:
    """
    Infers transferable skills, hidden prerequisites, and career transition pathways across the graph.
    """

    def __init__(self, entity_mgr: EntityManager, rel_mgr: RelationshipManager):
        self.entity_mgr = entity_mgr
        self.rel_mgr = rel_mgr

    def infer_transferable_skills(self, source_skill_id: str) -> List[Dict[str, Any]]:
        edges = self.rel_mgr.get_outgoing_edges(source_skill_id)
        transferable = []
        for e in edges:
            node = self.entity_mgr.get_node(e.target_id)
            if node:
                transferable.append({
                    "target_skill_id": node.id,
                    "target_skill_name": node.name,
                    "relationship": e.rel_type.value,
                    "confidence": e.weight
                })
        return transferable

    def infer_career_transition(self, current_role_id: str) -> List[Dict[str, Any]]:
        edges = self.rel_mgr.get_outgoing_edges(current_role_id)
        transitions = []
        for e in edges:
            if e.rel_type == RelationshipType.LEADS_TO:
                node = self.entity_mgr.get_node(e.target_id)
                if node:
                    transitions.append({
                        "target_role_id": node.id,
                        "target_role_name": node.name,
                        "feasibility_score": round(e.weight * 100.0, 1)
                    })
        return transitions
