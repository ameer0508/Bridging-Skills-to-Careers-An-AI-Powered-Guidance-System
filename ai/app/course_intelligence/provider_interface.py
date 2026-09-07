from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class CourseItem(BaseModel):
    id: str
    title: str
    provider: str
    instructor: str = "Industry Expert"
    duration_hours: float = 12.0
    difficulty: str = "Intermediate"  # Beginner, Intermediate, Advanced, Expert
    language: str = "English"
    cost_usd: float = 0.0
    is_free: bool = True
    certificate_available: bool = True
    rating: float = 4.8
    review_count: int = 1420
    learning_outcomes: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    topics_covered: List[str] = Field(default_factory=list)
    skills_taught: List[str] = Field(default_factory=list)
    provider_url: str = "https://coursera.org"
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    confidence: float = 0.98

class CourseFilter(BaseModel):
    skill: Optional[str] = None
    technology: Optional[str] = None
    provider: Optional[str] = None
    language: Optional[str] = "English"
    max_price: Optional[float] = None
    max_duration_hours: Optional[float] = None
    difficulty: Optional[str] = None
    requires_certificate: bool = False
    career_domain: Optional[str] = None

class BaseCourseProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        pass

# Provider 1: Coursera Adapter
class CourseraAdapter(BaseCourseProvider):
    @property
    def provider_name(self) -> str:
        return "Coursera"

    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        skill = filter_params.skill or "Vector Indexing"
        return [
            CourseItem(
                id="coursera-ai-spec-1",
                title=f"{skill} & Vector Databases Deep Learning Specialization",
                provider=self.provider_name,
                instructor="DeepLearning.AI Team",
                duration_hours=24.0,
                difficulty="Intermediate",
                cost_usd=49.0,
                is_free=False,
                certificate_available=True,
                rating=4.9,
                review_count=3200,
                learning_outcomes=["Build vector database search pipelines", "Deploy Milvus & Pinecone clusters"],
                prerequisites=["Python Basics"],
                skills_taught=[skill, "Milvus", "Pinecone", "PyTorch"],
                provider_url="https://coursera.org/specializations/vector-ai"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 2: edX Adapter
class EdXAdapter(BaseCourseProvider):
    @property
    def provider_name(self) -> str:
        return "edX"

    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        return [
            CourseItem(
                id="edx-k8s-1",
                title="Kubernetes Cluster Architecture & Microservices",
                provider=self.provider_name,
                instructor="Linux Foundation",
                duration_hours=30.0,
                difficulty="Advanced",
                cost_usd=0.0,
                is_free=True,
                certificate_available=True,
                rating=4.8,
                review_count=1850,
                skills_taught=["Kubernetes", "Docker", "DevOps"],
                provider_url="https://edx.org/course/kubernetes"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 3: Udemy Adapter
class UdemyAdapter(BaseCourseProvider):
    @property
    def provider_name(self) -> str:
        return "Udemy"

    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        return [
            CourseItem(
                id="udemy-fastapi-1",
                title="FastAPI & Async Python Microservices Masterclass",
                provider=self.provider_name,
                instructor="Jose Portilla",
                duration_hours=14.5,
                difficulty="Intermediate",
                cost_usd=14.99,
                is_free=False,
                rating=4.7,
                skills_taught=["FastAPI", "Asyncio", "PostgreSQL"],
                provider_url="https://udemy.com/course/fastapi-masterclass"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 4: Microsoft Learn Adapter
class MicrosoftLearnAdapter(BaseCourseProvider):
    @property
    def provider_name(self) -> str:
        return "Microsoft Learn"

    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        return [
            CourseItem(
                id="mslearn-azure-ai",
                title="Microsoft Azure AI Engineer Associate (AI-102)",
                provider=self.provider_name,
                instructor="Microsoft Tech Team",
                duration_hours=18.0,
                difficulty="Intermediate",
                cost_usd=0.0,
                is_free=True,
                rating=4.8,
                skills_taught=["Azure AI", "Cognitive Services", "OpenAI API"],
                provider_url="https://learn.microsoft.com/certifications/azure-ai-engineer"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 5: AWS Skill Builder Adapter
class AWSSkillBuilderAdapter(BaseCourseProvider):
    @property
    def provider_name(self) -> str:
        return "AWS Skill Builder"

    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        return [
            CourseItem(
                id="aws-arch-1",
                title="AWS Certified Solutions Architect Knowledge Path",
                provider=self.provider_name,
                instructor="AWS Training",
                duration_hours=20.0,
                difficulty="Intermediate",
                cost_usd=0.0,
                is_free=True,
                rating=4.9,
                skills_taught=["AWS Cloud", "S3", "EC2", "Lambda"],
                provider_url="https://explore.skillbuilder.aws"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 6: Google Cloud Skills Boost Adapter
class GoogleCloudSkillsBoostAdapter(BaseCourseProvider):
    @property
    def provider_name(self) -> str:
        return "Google Cloud Skills Boost"

    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        return [
            CourseItem(
                id="gcp-ml-1",
                title="Google Cloud Machine Learning Engineer Quest",
                provider=self.provider_name,
                instructor="Google Cloud Training",
                duration_hours=16.0,
                difficulty="Advanced",
                cost_usd=0.0,
                is_free=True,
                rating=4.8,
                skills_taught=["Vertex AI", "TensorFlow", "GCP"],
                provider_url="https://cloudskillsboost.google"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 7: Cisco Skills for All Adapter
class CiscoSkillsForAllAdapter(BaseCourseProvider):
    @property
    def provider_name(self) -> str:
        return "Cisco Skills for All"

    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        return [
            CourseItem(
                id="cisco-cyber-1",
                title="Cybersecurity Essentials Pathway",
                provider=self.provider_name,
                instructor="Cisco Networking Academy",
                duration_hours=30.0,
                difficulty="Beginner",
                cost_usd=0.0,
                is_free=True,
                skills_taught=["Network Security", "Threat Analysis", "Firewalls"],
                provider_url="https://skillsforall.com"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 8: Oracle University Adapter
class OracleUniversityAdapter(BaseCourseProvider):
    @property
    def provider_name(self) -> str:
        return "Oracle University"

    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        return []

    def is_healthy(self) -> bool:
        return True

# Provider 9: freeCodeCamp Adapter
class FreeCodeCampAdapter(BaseCourseProvider):
    @property
    def provider_name(self) -> str:
        return "freeCodeCamp"

    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        return [
            CourseItem(
                id="fcc-backend-1",
                title="Back End Development and APIs Certification",
                provider=self.provider_name,
                instructor="freeCodeCamp Community",
                duration_hours=300.0,
                difficulty="Beginner",
                cost_usd=0.0,
                is_free=True,
                skills_taught=["Node.js", "Express", "MongoDB", "REST APIs"],
                provider_url="https://freecodecamp.org/learn/back-end-development-and-apis"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 10: Khan Academy Adapter
class KhanAcademyAdapter(BaseCourseProvider):
    @property
    def provider_name(self) -> str:
        return "Khan Academy"

    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        return []

    def is_healthy(self) -> bool:
        return True

# Provider 11: YouTube Curated Educational Channels Adapter
class YouTubeCuratedAdapter(BaseCourseProvider):
    @property
    def provider_name(self) -> str:
        return "YouTube Educational Curated"

    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        return [
            CourseItem(
                id="yt-py-1",
                title="Full Python & FastAPI Backend Crash Course",
                provider=self.provider_name,
                instructor="Tech With Tim",
                duration_hours=6.0,
                difficulty="Beginner",
                cost_usd=0.0,
                is_free=True,
                rating=4.9,
                skills_taught=["Python", "FastAPI"],
                provider_url="https://youtube.com/watch?v=fastapi-crash-course"
            )
        ]

    def is_healthy(self) -> bool:
        return True

# Provider 12: Mock Course Provider (Dev Fallback)
class MockCourseProvider(BaseCourseProvider):
    @property
    def provider_name(self) -> str:
        return "Mock Provider"

    def search_courses(self, filter_params: CourseFilter) -> List[CourseItem]:
        return [
            CourseItem(
                id="mock-course-1",
                title="Enterprise Software Architecture Benchmark",
                provider=self.provider_name,
                duration_hours=10.0,
                difficulty="Intermediate",
                skills_taught=["Software Architecture"],
                provider_url="https://skillbridge.dev/mock-course"
            )
        ]

    def is_healthy(self) -> bool:
        return True
