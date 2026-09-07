import logging
from typing import List, Dict
from app.salary_intelligence.salary_provider import (
    BaseSalaryProvider,
    SalaryFilter,
    SalaryDataPoint,
    AdzunaSalaryProvider,
    JSearchSalaryProvider,
    LevelsFyiSalaryProvider,
    GovLaborStatsSalaryProvider,
    CustomDatasetSalaryProvider,
    MockSalaryProvider,
)

logger = logging.getLogger("skillbridge-ai")

class SalaryProviderManager:
    """
    Manages registration, discovery, fallback, and query execution across all active Salary Providers.
    """

    def __init__(self):
        self._providers: Dict[str, BaseSalaryProvider] = {}
        self._register_default_providers()

    def _register_default_providers(self):
        defaults = [
            AdzunaSalaryProvider(),
            JSearchSalaryProvider(),
            LevelsFyiSalaryProvider(),
            GovLaborStatsSalaryProvider(),
            CustomDatasetSalaryProvider(),
            MockSalaryProvider(),
        ]
        for provider in defaults:
            self.register_provider(provider)

    def register_provider(self, provider: BaseSalaryProvider):
        self._providers[provider.provider_name] = provider
        logger.info(f"Registered Salary Provider: {provider.provider_name}")

    def get_provider(self, name: str) -> BaseSalaryProvider:
        return self._providers.get(name)

    def fetch_all(self, filter_params: SalaryFilter) -> List[SalaryDataPoint]:
        all_results: List[SalaryDataPoint] = []
        for name, provider in self._providers.items():
            try:
                if provider.is_healthy():
                    data = provider.fetch_salary_data(filter_params)
                    all_results.extend(data)
            except Exception as e:
                logger.error(f"Error fetching from provider {name}: {e}")
        return all_results
