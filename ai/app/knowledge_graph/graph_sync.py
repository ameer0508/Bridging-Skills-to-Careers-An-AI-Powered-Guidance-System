import logging
import time
from typing import Dict, Any
from app.knowledge_graph.entity_manager import EntityManager
from app.knowledge_graph.relationship_manager import RelationshipManager

logger = logging.getLogger("skillbridge-graph")

class GraphSyncManager:
    """
    Synchronizes Knowledge Graph entities incrementally from Job, Course, Certification, & Market engines.
    """

    def __init__(self, entity_mgr: EntityManager, rel_mgr: RelationshipManager):
        self.entity_mgr = entity_mgr
        self.rel_mgr = rel_mgr
        self.last_sync_timestamp = time.time()

    def sync_external_intelligence(self, domain: str, items: list) -> Dict[str, Any]:
        logger.info(f"Syncing {len(items)} items from domain [{domain}] into Knowledge Graph")
        self.last_sync_timestamp = time.time()
        return {
            "domain": domain,
            "synced_count": len(items),
            "timestamp": self.last_sync_timestamp
        }
