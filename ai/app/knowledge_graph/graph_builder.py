import logging
from app.knowledge_graph.ontology_manager import EntityType, RelationshipType
from app.knowledge_graph.entity_manager import EntityManager
from app.knowledge_graph.relationship_manager import RelationshipManager

logger = logging.getLogger("skillbridge-graph")

class GraphBuilder:
    """
    Constructs the central career ecosystem Knowledge Graph with standard nodes & edges.
    """

    @staticmethod
    def build_default_graph(entity_mgr: EntityManager, rel_mgr: RelationshipManager):
        # 1. Seed Nodes
        py = entity_mgr.add_node("skill-python", "Python", EntityType.PROGRAMMING_LANGUAGE)
        fa = entity_mgr.add_node("tech-fastapi", "FastAPI", EntityType.FRAMEWORK)
        vi = entity_mgr.add_node("skill-vector", "Vector Indexing", EntityType.SKILL)
        k8s = entity_mgr.add_node("tech-k8s", "Kubernetes", EntityType.TECHNOLOGY)

        role_ai = entity_mgr.add_node("role-ai-engineer", "AI Infrastructure Engineer", EntityType.CAREER_ROLE)
        role_backend = entity_mgr.add_node("role-backend-dev", "Senior Backend Developer", EntityType.CAREER_ROLE)

        course_vector = entity_mgr.add_node("course-vector-spec", "Vector DB Specialization", EntityType.COURSE)
        cert_cka = entity_mgr.add_node("cert-cka", "Certified Kubernetes Administrator", EntityType.CERTIFICATION)

        # 2. Seed Relationships
        rel_mgr.add_edge(fa.id, py.id, RelationshipType.USES)
        rel_mgr.add_edge(role_ai.id, vi.id, RelationshipType.REQUIRES, weight=0.95)
        rel_mgr.add_edge(role_ai.id, k8s.id, RelationshipType.REQUIRES, weight=0.90)
        rel_mgr.add_edge(role_ai.id, fa.id, RelationshipType.REQUIRES, weight=0.85)

        rel_mgr.add_edge(course_vector.id, vi.id, RelationshipType.RECOMMENDS)
        rel_mgr.add_edge(cert_cka.id, k8s.id, RelationshipType.CERTIFIES)
        rel_mgr.add_edge(role_backend.id, role_ai.id, RelationshipType.LEADS_TO, weight=0.80)

        logger.info(f"Seeded Knowledge Graph: {entity_mgr.total_nodes()} nodes, {rel_mgr.total_edges()} edges.")
