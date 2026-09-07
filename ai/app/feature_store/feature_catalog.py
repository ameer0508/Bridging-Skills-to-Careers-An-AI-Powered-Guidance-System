from typing import Dict, List, Optional
from app.feature_store.feature_registry import FeatureDefinition, FeatureDomain

class FeatureCatalog:
    """
    Central catalog registering all 12 feature domains and definitions.
    """

    def __init__(self):
        self._catalog: Dict[str, FeatureDefinition] = {}
        self._seed_default_catalog()

    def _seed_default_catalog(self):
        feats = [
            FeatureDefinition(feature_name="resume_experience_years", domain=FeatureDomain.RESUME, data_type="float", description="Total years of experience extracted from resume"),
            FeatureDefinition(feature_name="skill_gap_count", domain=FeatureDomain.SKILL, data_type="int", description="Number of missing required skills for target role"),
            FeatureDefinition(feature_name="career_match_score", domain=FeatureDomain.MATCH, data_type="float", description="Multi-criteria career alignment score (0-100)"),
            FeatureDefinition(feature_name="career_readiness_score", domain=FeatureDomain.READINESS, data_type="float", description="Overall career readiness score (0-100)"),
            FeatureDefinition(feature_name="learning_velocity", domain=FeatureDomain.PROGRESS, data_type="float", description="Weekly course completion velocity"),
            FeatureDefinition(feature_name="market_demand_velocity", domain=FeatureDomain.MARKET, data_type="float", description="YoY market hiring demand percentage"),
        ]
        for f in feats:
            self._catalog[f.feature_name] = f

    def get_feature(self, name: str) -> Optional[FeatureDefinition]:
        return self._catalog.get(name)

    def list_features(self) -> List[FeatureDefinition]:
        return list(self._catalog.values())
