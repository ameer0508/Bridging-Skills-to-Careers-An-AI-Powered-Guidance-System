import time
import logging
from typing import Dict, Any, List, Optional
from app.knowledge_graph.entity_manager import EntityManager
from app.knowledge_graph.relationship_manager import RelationshipManager
from app.knowledge_graph.graph_builder import GraphBuilder
from app.knowledge_graph.inference_engine import InferenceEngine
from app.knowledge_graph.graph_query import GraphQueryEngine
from app.knowledge_graph.graph_validator import GraphValidator
from app.knowledge_graph.graph_sync import GraphSyncManager
from app.knowledge_graph.graph_metrics import GraphMetricsCollector

logger = logging.getLogger("skillbridge-graph")

class KnowledgeGraphEngine:
    """
    Central Knowledge Graph Engine Facade for SkillBridge.
    Centralized semantic network powering career matching, course paths, cert pathways,
    skill transferability, and market alignment.
    """

    def __init__(self):
        self.entity_mgr = EntityManager()
        self.rel_mgr = RelationshipManager()
        
        # Build initial graph topology
        GraphBuilder.build_default_graph(self.entity_mgr, self.rel_mgr)

        self.inference_engine = InferenceEngine(self.entity_mgr, self.rel_mgr)
        self.query_engine = GraphQueryEngine(self.entity_mgr, self.rel_mgr)
        self.sync_mgr = GraphSyncManager(self.entity_mgr, self.rel_mgr)

    def query_neighborhood(self, node_id: str) -> Dict[str, Any]:
        start = time.time()
        res = self.query_engine.get_skill_neighborhood(node_id)
        res["query_latency_ms"] = round((time.time() - start) * 1000, 2)
        return res

    def find_shortest_learning_path(self, start_id: str, target_id: str) -> Dict[str, Any]:
        start = time.time()
        path = self.query_engine.shortest_path(start_id, target_id)
        return {
            "start_id": start_id,
            "target_id": target_id,
            "path_found": path is not None,
            "path_nodes": path or [],
            "path_length": len(path) if path else 0,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "metrics": GraphMetricsCollector.get_topology_metrics(self.entity_mgr, self.rel_mgr),
            "validation": GraphValidator.validate_graph(self.entity_mgr, self.rel_mgr)
        }

# Global Singleton Instance
knowledge_graph_instance = KnowledgeGraphEngine()
