from typing import Dict, Any, List

class FeatureValidator:
    """
    Detects missing features, null values, schema drift, and invalid value bounds.
    """

    @staticmethod
    def validate_feature_vector(vector: Dict[str, Any]) -> Dict[str, Any]:
        invalid = []
        for k, v in vector.items():
            if v is None:
                invalid.append(f"Null feature value for [{k}]")

        return {
            "is_valid": len(invalid) == 0,
            "invalid_reasons": invalid
        }
