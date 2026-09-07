import logging
from typing import Dict, List, Optional
from app.external_gateway.provider_interface import BaseExternalProvider

logger = logging.getLogger("skillbridge-gateway")

class ProviderRegistry:
    """
    Central Provider Registry for auto-registering and discovering external intelligence providers.
    """

    def __init__(self):
        self._registry: Dict[str, Dict[str, BaseExternalProvider]] = {
            "job": {},
            "salary": {},
            "course": {},
            "certification": {},
            "market_trend": {},
        }

    def register(self, provider: BaseExternalProvider):
        domain = provider.domain.lower()
        if domain not in self._registry:
            self._registry[domain] = {}
        self._registry[domain][provider.provider_id] = provider
        logger.info(f"Registered External Provider [{provider.provider_id}] for domain [{domain}]")

    def get_providers_for_domain(self, domain: str) -> List[BaseExternalProvider]:
        return list(self._registry.get(domain.lower(), {}).values())

    def get_provider(self, domain: str, provider_id: str) -> Optional[BaseExternalProvider]:
        return self._registry.get(domain.lower(), {}).get(provider_id)

    def list_all_registered(self) -> Dict[str, List[str]]:
        return {d: list(providers.keys()) for d, providers in self._registry.items()}

# Global Registry Instance
registry_instance = ProviderRegistry()
