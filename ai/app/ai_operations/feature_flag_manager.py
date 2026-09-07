from typing import Dict, Any

class FeatureFlagManager:
    """
    Manages canary feature flags, percentage rollouts, provider switching, & kill switches.
    """

    def __init__(self):
        self._flags: Dict[str, bool] = {
            "enable_gemini_2_5_flash": True,
            "enable_external_intelligence_gateway": True,
            "enable_knowledge_graph_inference": True,
            "emergency_kill_switch": False
        }

    def is_enabled(self, flag_key: str) -> bool:
        if self._flags.get("emergency_kill_switch", False):
            return False
        return self._flags.get(flag_key, False)

    def set_flag(self, flag_key: str, enabled: bool):
        self._flags[flag_key] = enabled
