from abc import ABC, abstractmethod
from typing import Any, List, Dict, Optional
from app.schemas.ai_response import UnifiedAIResponse

class BaseAIProvider(ABC):
    """
    Abstract Base Class for all AI Provider Adapters in SkillBridge.
    Enforces unified interfaces and standard response wrapping across all AI models.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def default_model(self) -> str:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Checks if the provider API key or service endpoint is configured."""
        pass

    @abstractmethod
    def generate_content(self, prompt: str, **kwargs) -> UnifiedAIResponse:
        """Generates general text response from prompt."""
        pass

    @abstractmethod
    def parse_resume_text(self, text: str, schema_class: Any) -> UnifiedAIResponse:
        """Parses raw text into structured JSON matching schema_class."""
        pass

    @abstractmethod
    def normalize_skills(self, raw_skills: List[str], schema_class: Any) -> UnifiedAIResponse:
        """Normalizes raw skill list into canonical taxonomy matching schema_class."""
        pass

    @abstractmethod
    def match_career(self, user_skills: List[str], target_role: str, experience_years: float, schema_class: Any) -> UnifiedAIResponse:
        """Calculates career match score and skill delta."""
        pass

    @abstractmethod
    def calculate_readiness(self, user_skills: List[str], required_skills: List[str], role_title: str, schema_class: Any) -> UnifiedAIResponse:
        """Calculates career readiness score and action items."""
        pass

    @abstractmethod
    def generate_recommendations(self, user_skills: List[str], career_goal: str, learning_style: str, schema_class: Any) -> UnifiedAIResponse:
        """Generates personalized action items and learning recommendations."""
        pass

    @abstractmethod
    def generate_roadmap(self, current_level: str, target_role: str, target_months: int, schema_class: Any) -> UnifiedAIResponse:
        """Generates structured multi-phase learning roadmap."""
        pass

    @abstractmethod
    def generate_analytics(self, user_id: str, skills_trend: List[Dict[str, Any]], schema_class: Any) -> UnifiedAIResponse:
        """Generates skill growth metrics and market insights."""
        pass

    @abstractmethod
    def analyze_resume_intelligence(self, resume_text: str, target_role: Optional[str], schema_class: Any) -> UnifiedAIResponse:
        """Audits resume quality, ATS compatibility, and keyword optimizations."""
        pass
