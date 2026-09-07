import logging
from typing import List, Dict
from app.market_intelligence.trend_provider import (
    BaseTrendProvider,
    TrendFilter,
    MarketTrendPoint,
    JobIntelligenceTrendAdapter,
    SalaryIntelligenceTrendAdapter,
    GovLaborStatsTrendAdapter,
    TechTrendDatasetAdapter,
    StackOverflowTrendAdapter,
    GitHubEcosystemTrendAdapter,
    CustomDatasetTrendAdapter,
    MockTrendProvider,
)

logger = logging.getLogger("skillbridge-ai")

class TrendProviderManager:
    """
    Manages registration, discovery, fallback, and query execution across all Market Trend Providers.
    """

    def __init__(self):
        self._providers: Dict[str, BaseTrendProvider] = {}
        self._register_defaults()

    def _register_defaults(self):
        defaults = [
            JobIntelligenceTrendAdapter(),
            SalaryIntelligenceTrendAdapter(),
            GovLaborStatsTrendAdapter(),
            TechTrendDatasetAdapter(),
            StackOverflowTrendAdapter(),
            GitHubEcosystemTrendAdapter(),
            CustomDatasetTrendAdapter(),
            MockTrendProvider(),
        ]
        for provider in defaults:
            self.register_provider(provider)

    def register_provider(self, provider: BaseTrendProvider):
        self._providers[provider.provider_name] = provider
        logger.info(f"Registered Market Trend Provider: {provider.provider_name}")

    def fetch_all_trends(self, filter_params: TrendFilter) -> List[MarketTrendPoint]:
        all_trends: List[MarketTrendPoint] = []
        for name, provider in self._providers.items():
            try:
                if provider.is_healthy():
                    data = provider.fetch_trends(filter_params)
                    all_trends.extend(data)
            except Exception as e:
                logger.error(f"Error fetching trends from provider {name}: {e}")
        return all_trends
