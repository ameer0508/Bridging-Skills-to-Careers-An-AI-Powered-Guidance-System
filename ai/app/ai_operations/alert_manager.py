import logging
import time
from typing import List, Dict, Any

logger = logging.getLogger("skillbridge-aiops")

class AlertManager:
    """
    Evaluates SLO thresholds & fires alerts for latency spikes, provider errors, and prediction degradation.
    """

    def __init__(self):
        self._alerts: List[Dict[str, Any]] = []

    def check_thresholds(self, avg_latency_ms: float, error_rate_percent: float):
        if avg_latency_ms > 300.0:
            self._fire_alert("HIGH_LATENCY", f"Average AI latency spike: {avg_latency_ms}ms > 300ms SLA target", "WARNING")
        if error_rate_percent > 1.0:
            self._fire_alert("PROVIDER_ERROR_SPIKE", f"AI Provider error rate: {error_rate_percent}% > 1% threshold", "CRITICAL")

    def _fire_alert(self, alert_type: str, message: str, severity: str):
        alert = {
            "alert_type": alert_type,
            "message": message,
            "severity": severity,
            "timestamp": time.time()
        }
        self._alerts.append(alert)
        logger.warning(f"ALERT [{severity}] {alert_type}: {message}")

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        return self._alerts
