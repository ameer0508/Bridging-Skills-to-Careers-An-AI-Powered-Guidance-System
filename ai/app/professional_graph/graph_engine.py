import time
import logging
from typing import Dict, Any, List, Optional
from app.professional_graph.graph_builder import GraphBuilder
from app.professional_graph.evidence_engine import EvidenceEngine
from app.professional_graph.confidence_engine import ConfidenceEngine
from app.professional_graph.contradiction_detector import ContradictionDetector
from app.professional_graph.profile_reconciler import ProfileReconciler
from app.professional_graph.graph_query import GraphQueryEngine
from app.professional_graph.graph_reasoner import GraphReasoner
from app.professional_graph.graph_sync import GraphSyncManager
from app.professional_graph.graph_versioning import GraphVersionManager
from app.professional_graph.graph_export import GraphExporter

logger = logging.getLogger("skillbridge-graph")

class UnifiedProfessionalGraphEngine:
    """
    Central Unified Professional Graph Engine Facade for SkillBridge.
    Synthesizes a Professional Digital Twin connecting skills, experiences, projects, & evidence.
    """

    def __init__(self):
        self.sync_mgr = GraphSyncManager()

    def get_digital_twin(self, user_id: str, claimed_skills: Optional[List[str]] = None) -> Dict[str, Any]:
        start = time.time()

        if claimed_skills is None:
            claimed_skills = ["Python", "FastAPI", "Docker", "Kubernetes", "Milvus", "React"]

        normalized_skills = [ProfileReconciler.normalize_skill(s) for s in claimed_skills]
        verified_skills = ["Python", "FastAPI", "Docker", "Kubernetes", "React"]

        graph_topology = GraphBuilder.build_user_digital_twin(user_id, normalized_skills)
        contradictions = ContradictionDetector.detect_contradictions(user_id, normalized_skills, verified_skills)
        inferred_skills = GraphReasoner.infer_hidden_skills(verified_skills)
        neighborhood = GraphQueryEngine.neighborhood_search(user_id, depth=1)
        version_meta = GraphVersionManager.get_current_version(user_id)

        self.sync_mgr.sync_user_graph(user_id)

        return {
            "user_id": user_id,
            "version": version_meta,
            "topology": graph_topology,
            "neighborhood": neighborhood,
            "inferred_skills": inferred_skills,
            "contradictions": contradictions,
            "health_score": 98.5 if len(contradictions) == 0 else 85.0,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

# Global Singleton Instance
unified_graph_instance = UnifiedProfessionalGraphEngine()
