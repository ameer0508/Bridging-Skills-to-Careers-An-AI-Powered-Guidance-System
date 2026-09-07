from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class MarketTrendPoint(BaseModel):
    name: str
    category: str  # Programming Languages, AI Frameworks, Cloud, DevOps, Cybersecurity, Data Tools
    demand_score: float = Field(default=85.0, ge=0.0, le=100.0)
    growth_rate_yoy: float = Field(default=18.5)
    market_saturation: float = Field(default=45.0, ge=0.0, le=100.0)
    competition_score: float = Field(default=60.0, ge=0.0, le=100.0)
    hiring_velocity: float = Field(default=92.0, ge=0.0, le=100.0)
    emerging_score: float = Field(default=75.0, ge=0.0, le=100.0)
    maturity_stage: str = "Growth"  # Emerging, Growth, Mature, Declining
    learning_priority: str = "High"  # High, Medium, Low
    confidence: float = 0.98
    provider: str
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class TrendFilter(BaseModel):
    category: Optional[str] = None
    query: Optional[str] = None
    country: Optional[str] = "United States"
    city: Optional[str] = None
    remote_only: bool = False
    experience_level: Optional[str] = None

class BaseTrendProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def fetch_trends(self, filter_params: TrendFilter) -> List[MarketTrendPoint]:
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        pass

# Provider 1: Job Intelligence Data Adapter
class JobIntelligenceTrendAdapter(BaseTrendProvider):
    @property
    def provider_name(self) -> str:
        return "Job Intelligence Adapter"

    def fetch_trends(self, filter_params: TrendFilter) -> List[MarketTrendPoint]:
        return [
            MarketTrendPoint(
                name="Vector Indexing (Milvus/Pinecone)",
                category="AI Frameworks",
                demand_score=94.5,
                growth_rate_yoy=34.2,
                emerging_score=92.0,
                maturity_stage="Emerging",
                learning_priority="High",
                provider=self.provider_name
            ),
            MarketTrendPoint(
                name="PyTorch 2.0",
                category="AI Frameworks",
                demand_score=96.0,
                growth_rate_yoy=28.0,
                emerging_score=85.0,
                maturity_stage="Growth",
                learning_priority="High",
                provider=self.provider_name
            ),
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 2: Salary Intelligence Adapter
class SalaryIntelligenceTrendAdapter(BaseTrendProvider):
    @property
    def provider_name(self) -> str:
        return "Salary Intelligence Adapter"

    def fetch_trends(self, filter_params: TrendFilter) -> List[MarketTrendPoint]:
        return [
            MarketTrendPoint(
                name="Kubernetes Cluster Ops",
                category="DevOps",
                demand_score=91.0,
                growth_rate_yoy=22.4,
                maturity_stage="Mature",
                learning_priority="High",
                provider=self.provider_name
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 3: Gov Labor Stats Adapter
class GovLaborStatsTrendAdapter(BaseTrendProvider):
    @property
    def provider_name(self) -> str:
        return "US BLS Market Adapter"

    def fetch_trends(self, filter_params: TrendFilter) -> List[MarketTrendPoint]:
        return [
            MarketTrendPoint(
                name="Software Engineering",
                category="General",
                demand_score=88.0,
                growth_rate_yoy=17.0,
                maturity_stage="Mature",
                learning_priority="Medium",
                provider=self.provider_name
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 4: Tech Trend Dataset Adapter
class TechTrendDatasetAdapter(BaseTrendProvider):
    @property
    def provider_name(self) -> str:
        return "Public Tech Trend Datasets"

    def fetch_trends(self, filter_params: TrendFilter) -> List[MarketTrendPoint]:
        return [
            MarketTrendPoint(
                name="FastAPI / Async Python",
                category="Programming Languages",
                demand_score=92.0,
                growth_rate_yoy=31.0,
                maturity_stage="Growth",
                learning_priority="High",
                provider=self.provider_name
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 5: Stack Overflow Adapter
class StackOverflowTrendAdapter(BaseTrendProvider):
    @property
    def provider_name(self) -> str:
        return "Stack Overflow Survey Adapter"

    def fetch_trends(self, filter_params: TrendFilter) -> List[MarketTrendPoint]:
        return [
            MarketTrendPoint(
                name="TypeScript",
                category="Programming Languages",
                demand_score=95.0,
                growth_rate_yoy=24.0,
                maturity_stage="Growth",
                learning_priority="High",
                provider=self.provider_name
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 6: GitHub Ecosystem Adapter
class GitHubEcosystemTrendAdapter(BaseTrendProvider):
    @property
    def provider_name(self) -> str:
        return "GitHub Ecosystem Adapter"

    def fetch_trends(self, filter_params: TrendFilter) -> List[MarketTrendPoint]:
        return [
            MarketTrendPoint(
                name="LangChain & LlamaIndex",
                category="AI Frameworks",
                demand_score=97.0,
                growth_rate_yoy=42.0,
                emerging_score=96.0,
                maturity_stage="Emerging",
                learning_priority="High",
                provider=self.provider_name
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 7: Custom Dataset Adapter
class CustomDatasetTrendAdapter(BaseTrendProvider):
    @property
    def provider_name(self) -> str:
        return "Custom Dataset Adapter"

    def fetch_trends(self, filter_params: TrendFilter) -> List[MarketTrendPoint]:
        return []

    def is_healthy(self) -> bool:
        return True

# Provider 8: Mock Provider (Dev Fallback)
class MockTrendProvider(BaseTrendProvider):
    @property
    def provider_name(self) -> str:
        return "Mock Provider"

    def fetch_trends(self, filter_params: TrendFilter) -> List[MarketTrendPoint]:
        return [
            MarketTrendPoint(
                name="Docker & Microservices",
                category="DevOps",
                demand_score=89.0,
                growth_rate_yoy=15.0,
                maturity_stage="Mature",
                learning_priority="Medium",
                provider=self.provider_name
            )
        ]

    def is_healthy(self) -> bool:
        return True
