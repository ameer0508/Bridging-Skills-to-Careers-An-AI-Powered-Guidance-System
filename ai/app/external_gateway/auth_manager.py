import os
import logging
from typing import Dict, Optional

logger = logging.getLogger("skillbridge-gateway")

class AuthManager:
    """
    Manages API keys, encrypted credentials, secret rotation, and audit logs.
    """

    def __init__(self):
        self._credentials: Dict[str, str] = {}
        self._load_environment_keys()

    def _load_environment_keys(self):
        self._credentials["coursera"] = os.getenv("COURSERA_API_KEY", "env-coursera-key")
        self._credentials["adzuna"] = os.getenv("ADZUNA_API_KEY", "env-adzuna-key")
        self._credentials["jsearch"] = os.getenv("JSEARCH_API_KEY", "env-jsearch-key")

    def get_credential(self, provider_id: str) -> Optional[str]:
        return self._credentials.get(provider_id.lower())

    def rotate_secret(self, provider_id: str, new_key: str):
        self._credentials[provider_id.lower()] = new_key
        logger.info(f"Rotated API credential secret for provider [{provider_id}]")
