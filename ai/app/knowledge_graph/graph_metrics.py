from typing import Dict, Any
from app.knowledge_graph.entity_manager import EntityManager
from app.knowledge_graph.relationship_manager import RelationshipManager

class GraphMetricsCollector:
    """
    Collects real-time Knowledge Graph topology metrics: nodes, edges, density, & average degree.
    """

    @staticmethod
    def get_topology_metrics(entity_mgr: EntityManager, rel_mgr: RelationshipManager) -> Dict[str, Any]:
        v = entity_mgr.total_nodes()
        e = rel_mgr.total_edges()
        density = (e / (v * (v - 1))) if v > 1 else 0.0
        avg_degree = (e / v) if v > 0 else 0.0

        return {
            "node_count": v,
            "edge_count": e,
            "graph_density": round(density, 4),
            "average_degree": round(avg_degree, 2),
            "status": "healthy"
        }
