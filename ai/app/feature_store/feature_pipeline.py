import logging
from typing import Dict, Any
from app.feature_store.feature_materializer import FeatureMaterializer
from app.feature_store.feature_validator import FeatureValidator
from app.feature_store.online_store import OnlineStore
from app.feature_store.offline_store import OfflineStore

logger = logging.getLogger("skillbridge-featurestore")

class FeaturePipeline:
    """
    Pipeline orchestrating feature materialization, validation, and dual-write to Online & Offline stores.
    """

    def __init__(self, online_store: OnlineStore, offline_store: OfflineStore):
        self.online_store = online_store
        self.offline_store = offline_store

    def run_pipeline_for_user(self, user_id: str, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        features = FeatureMaterializer.materialize_user_features(user_id, raw_data)
        validation = FeatureValidator.validate_feature_vector(features)
        
        if validation["is_valid"]:
            self.online_store.write_features(user_id, features)
            self.offline_store.append_snapshot(user_id, features)
            logger.info(f"FeaturePipeline: materialized & dual-wrote {len(features)} features for user [{user_id}]")
        return {
            "user_id": user_id,
            "features": features,
            "validation": validation
        }
