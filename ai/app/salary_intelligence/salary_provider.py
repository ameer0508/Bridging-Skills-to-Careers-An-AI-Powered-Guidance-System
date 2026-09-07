from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class SalaryDataPoint(BaseModel):
    job_title: str
    normalized_title: str
    company: Optional[str] = "Market Aggregate"
    location: str = "Global / Remote"
    experience_level: str = "Mid"
    salary_min: float
    salary_max: float
    salary_median: float
    currency: str = "USD"
    employment_type: str = "Full-time"
    industry: str = "Technology"
    required_skills: List[str] = Field(default_factory=list)
    provider: str
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    confidence: float = 0.95

class SalaryFilter(BaseModel):
    job_title: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    experience_level: Optional[str] = None
    industry: Optional[str] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    remote_only: bool = False

class BaseSalaryProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def fetch_salary_data(self, filter_params: SalaryFilter) -> List[SalaryDataPoint]:
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        pass

# Provider 1: Adzuna Adapter
class AdzunaSalaryProvider(BaseSalaryProvider):
    @property
    def provider_name(self) -> str:
        return "Adzuna"

    def fetch_salary_data(self, filter_params: SalaryFilter) -> List[SalaryDataPoint]:
        title = filter_params.job_title or "Software Engineer"
        return [
            SalaryDataPoint(
                job_title=f"Senior {title}",
                normalized_title=title,
                company="Adzuna Market Index",
                location=filter_params.location or "United States",
                experience_level=filter_params.experience_level or "Senior",
                salary_min=140000,
                salary_max=195000,
                salary_median=167500,
                currency="USD",
                industry=filter_params.industry or "Technology",
                required_skills=filter_params.skills or ["Python", "AWS", "FastAPI"],
                provider=self.provider_name
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 2: JSearch Adapter
class JSearchSalaryProvider(BaseSalaryProvider):
    @property
    def provider_name(self) -> str:
        return "JSearch"

    def fetch_salary_data(self, filter_params: SalaryFilter) -> List[SalaryDataPoint]:
        title = filter_params.job_title or "Data Scientist"
        return [
            SalaryDataPoint(
                job_title=f"Lead {title}",
                normalized_title=title,
                company="TechCorp JSearch",
                location=filter_params.location or "San Francisco, CA",
                experience_level="Lead",
                salary_min=165000,
                salary_max=220000,
                salary_median=192500,
                currency="USD",
                industry="Artificial Intelligence",
                required_skills=["PyTorch", "Python", "Vector Indexing"],
                provider=self.provider_name
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 3: Levels.fyi Adapter
class LevelsFyiSalaryProvider(BaseSalaryProvider):
    @property
    def provider_name(self) -> str:
        return "Levels.fyi"

    def fetch_salary_data(self, filter_params: SalaryFilter) -> List[SalaryDataPoint]:
        title = filter_params.job_title or "Software Engineer"
        return [
            SalaryDataPoint(
                job_title=f"Staff {title} (L6)",
                normalized_title=title,
                company="Tier 1 Tech",
                location="San Francisco Bay Area",
                experience_level="Principal",
                salary_min=210000,
                salary_max=340000,
                salary_median=275000,
                currency="USD",
                industry="Software",
                required_skills=["Distributed Systems", "Kubernetes", "Go"],
                provider=self.provider_name
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 4: Government Labor Statistics Adapter
class GovLaborStatsSalaryProvider(BaseSalaryProvider):
    @property
    def provider_name(self) -> str:
        return "US Bureau of Labor Statistics"

    def fetch_salary_data(self, filter_params: SalaryFilter) -> List[SalaryDataPoint]:
        title = filter_params.job_title or "Software Developer"
        return [
            SalaryDataPoint(
                job_title=title,
                normalized_title=title,
                company="US BLS Benchmark",
                location="National Median",
                experience_level="Mid",
                salary_min=110000,
                salary_max=165000,
                salary_median=132000,
                currency="USD",
                industry="Computer & Information Technology",
                required_skills=["Software Engineering"],
                provider=self.provider_name
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 5: Custom Dataset Adapter
class CustomDatasetSalaryProvider(BaseSalaryProvider):
    @property
    def provider_name(self) -> str:
        return "Custom Commercial Dataset"

    def fetch_salary_data(self, filter_params: SalaryFilter) -> List[SalaryDataPoint]:
        return []

    def is_healthy(self) -> bool:
        return True

# Provider 6: Mock Provider (Development Fallback)
class MockSalaryProvider(BaseSalaryProvider):
    @property
    def provider_name(self) -> str:
        return "Mock Provider"

    def fetch_salary_data(self, filter_params: SalaryFilter) -> List[SalaryDataPoint]:
        title = filter_params.job_title or "AI Architect"
        return [
            SalaryDataPoint(
                job_title=title,
                normalized_title=title,
                company="Mock Enterprises",
                location="Remote",
                experience_level="Senior",
                salary_min=150000,
                salary_max=210000,
                salary_median=180000,
                currency="USD",
                industry="AI",
                required_skills=["Python", "LLMs"],
                provider=self.provider_name
            )
        ]

    def is_healthy(self) -> bool:
        return True
