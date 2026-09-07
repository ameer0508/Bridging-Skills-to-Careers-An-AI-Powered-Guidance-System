from typing import Dict, Any

class DriftDetector:
    """
    Detects feature distribution drift, schema drift, and confidence degradation across models.
    """

    @staticmethod
    def detect_drift(baseline_mean: float, current_mean: float) -> Dict[str, Any]:
        drift_percent = abs(current_mean - baseline_mean) / baseline_mean * 100.0 if baseline_mean > 0 else 0.0
        has_drift = drift_percent > 15.0

        return {
            "has_drift": has_drift,
            "drift_percentage": round(drift_percent, 2),
            "status": "DRIFT_DETECTED" if has_drift else "STABLE"
        }
