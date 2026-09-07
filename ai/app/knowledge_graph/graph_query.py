from typing import List, Dict, Any, Optional
from collections import deque
from app.knowledge_graph.entity_manager import EntityManager
from app.knowledge_graph.relationship_manager import RelationshipManager

class GraphQueryEngine:
    """
    Executes graph queries: Shortest Path, Skill Neighborhoods, Tech Dependencies, & Pathways.
    """

    def __init__(self, entity_mgr: EntityManager, rel_mgr: RelationshipManager):
        self.entity_mgr = entity_mgr
        self.rel_mgr = rel_mgr

    def shortest_path(self, start_id: str, target_id: str) -> Optional[List[str]]:
        """BFS Shortest Path Traversal between start_id and target_id"""
        if start_id == target_id:
            return [start_id]

        queue = deque([[start_id]])
        visited = {start_id}

        while queue:
            path = queue.popleft()
            curr = path[-1]
            edges = self.rel_mgr.get_outgoing_edges(curr)

            for edge in edges:
                nxt = edge.target_id
                if nxt == target_id:
                    return path + [nxt]
                if nxt not in visited:
                    visited.add(nxt)
                    queue.append(path + [nxt])
        return None

    def get_skill_neighborhood(self, node_id: str, depth: int = 1) -> Dict[str, Any]:
        edges = self.rel_mgr.get_outgoing_edges(node_id)
        neighbors = []
        for e in edges:
            node = self.entity_mgr.get_node(e.target_id)
            if node:
                neighbors.append({
                    "id": node.id,
                    "name": node.name,
                    "type": node.entity_type.value,
                    "relationship": e.rel_type.value
                })
        curr_node = self.entity_mgr.get_node(node_id)
        return {
            "root_node": curr_node.model_dump() if curr_node else None,
            "neighborhood_size": len(neighbors),
            "neighbors": neighbors
        }
