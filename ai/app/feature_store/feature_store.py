import time
import logging
from typing import Dict, Any, List, Optional
from app.feature_store.feature_catalog import FeatureCatalog
from app.feature_store.feature_versioning import FeatureVersionManager
from app.feature_store.online_store import OnlineStore
from app.feature_store.offline_store import OfflineStore
from app.feature_store.feature_cache import FeatureCache
from app.feature_store.feature_pipeline import FeaturePipeline
from app.feature_store.memory_manager import AIMemoryManager
from app.feature_store.metrics import FeatureStoreMetricsCollector

logger = logging.getLogger("skillbridge-featurestore")

class FeatureStore:
    """
    Central Feature Store & Memory Platform Facade for SkillBridge.
    Serves low-latency online features, offline training snapshots, and long-term user memory.
    """

    def __init__(self):
        self.catalog = FeatureCatalog()
        self.version_mgr = FeatureVersionManager()
        self.online_store = OnlineStore()
        self.offline_store = OfflineStore()
        self.cache = FeatureCache()
        self.pipeline = FeaturePipeline(self.online_store, self.offline_store)
        self.memory_mgr = AIMemoryManager()
        self.metrics = FeatureStoreMetricsCollector()

    def get_online_features(self, entity_id: str, feature_names: List[str]) -> Dict[str, Any]:
        start = time.time()
        res = self.online_store.read_features(entity_id, feature_names)
        hit = len(res) == len(feature_names) and len(feature_names) > 0
        self.metrics.record_lookup(hit)
        logger.debug(f"FeatureStore: fetched {len(res)} online features in {round((time.time() - start)*1000, 2)}ms")
        return res

    def materialize_entity(self, entity_id: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.pipeline.run_pipeline_for_user(entity_id, raw_data)

    def get_user_memory(self, user_id: str) -> Dict[str, Any]:
        return self.memory_mgr.get_user_memory(user_id)

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "metrics": self.metrics.get_metrics(),
            "catalog_count": len(self.catalog.list_features()),
            "status": "healthy"
        }

# Global Singleton Instance
feature_store_instance = FeatureStore()
