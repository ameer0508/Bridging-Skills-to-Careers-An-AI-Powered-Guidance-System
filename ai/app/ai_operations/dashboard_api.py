import logging
from typing import Dict, Any
from app.ai_operations.metrics_engine import MetricsEngine
from app.ai_operations.tracing_engine import TracingEngine
from app.ai_operations.alert_manager import AlertManager
from app.ai_operations.health_monitor import AIOperationsHealthMonitor
from app.ai_operations.drift_detector import DriftDetector
from app.ai_operations.experiment_manager import ExperimentManager
from app.ai_operations.feature_flag_manager import FeatureFlagManager
from app.ai_operations.slo_manager import SLOManager
from app.ai_operations.audit_logger import AuditLogger
from app.ai_operations.incident_manager import IncidentManager

logger = logging.getLogger("skillbridge-aiops")

class AIOperationsEngine:
    """
    Central AI Observability & Operations Platform Facade for SkillBridge.
    Unifies Metrics, Distributed Tracing, Alerting, Model Drift, A/B Testing, Feature Flags, & SLO Governance.
    """

    def __init__(self):
        self.metrics_engine = MetricsEngine()
        self.tracing_engine = TracingEngine()
        self.alert_manager = AlertManager()
        self.health_monitor = AIOperationsHealthMonitor()
        self.drift_detector = DriftDetector()
        self.experiment_mgr = ExperimentManager()
        self.feature_flag_mgr = FeatureFlagManager()
        self.slo_mgr = SLOManager()
        self.audit_logger = AuditLogger()
        self.incident_mgr = IncidentManager()

    def get_dashboard_summary(self) -> Dict[str, Any]:
        metrics = self.metrics_engine.get_summary()
        self.alert_manager.check_thresholds(metrics["average_latency_ms"], 0.0)
        
        return {
            "metrics": metrics,
            "health": self.health_monitor.get_health_summary(),
            "active_alerts": self.alert_manager.get_active_alerts(),
            "slo": self.slo_mgr.evaluate_slo(),
            "incidents": self.incident_mgr.list_active_incidents(),
            "status": "healthy"
        }

# Global Singleton Instance
ai_operations_instance = AIOperationsEngine()
