import os
import time
import logging
from typing import Any, List, Dict, Optional
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    types = None
    GENAI_AVAILABLE = False
from app.providers.base_provider import BaseAIProvider
from app.schemas.ai_response import UnifiedAIResponse
from app.prompts.prompt_manager import PromptManager
from app.utils.response_normalizer import ResponseNormalizer

logger = logging.getLogger("skillbridge-ai")

class GeminiProvider(BaseAIProvider):
    """
    Google GenAI / Gemini Provider Adapter for SkillBridge AI Intelligence Layer.
    """

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self._model_name = model_name
        self.api_key = os.getenv("GEMINI_API_KEY")
        if GENAI_AVAILABLE and self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            logger.warning("GEMINI_API_KEY is not set or google-genai package not available. Client initialization deferred.")
            self.client = None

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def default_model(self) -> str:
        return self._model_name

    def is_available(self) -> bool:
        return bool(self.api_key or os.getenv("GEMINI_API_KEY"))

    def _get_client(self) -> genai.Client:
        if not self.client:
            key = os.getenv("GEMINI_API_KEY")
            if not key:
                raise ValueError("GEMINI_API_KEY is not set in the environment.")
            self.client = genai.Client(api_key=key)
        return self.client

    def _execute_structured_prompt(self, prompt: str, schema_class: Any, metadata_tag: str) -> UnifiedAIResponse:
        start_time = time.time()
        try:
            client = self._get_client()
            response = client.models.generate_content(
                model=self._model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schema_class,
                    temperature=0.1,
                ),
            )
            latency = (time.time() - start_time) * 1000
            parsed_data = schema_class.model_validate_json(response.text)

            return ResponseNormalizer.normalize_success(
                raw_data=parsed_data.model_dump(),
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=prompt,
                completion_text=response.text,
                metadata={"parsing_engine": metadata_tag}
            )
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"GeminiProvider {metadata_tag} failed: {e}")
            return ResponseNormalizer.normalize_error(
                error_msg=str(e),
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=prompt,
                metadata={"error_type": type(e).__name__, "tag": metadata_tag}
            )

    def generate_content(self, prompt: str, **kwargs) -> UnifiedAIResponse:
        start_time = time.time()
        try:
            client = self._get_client()
            full_prompt = PromptManager.get_career_architect_prompt(prompt)
            response = client.models.generate_content(
                model=self._model_name,
                contents=full_prompt,
            )
            latency = (time.time() - start_time) * 1000
            text_content = response.text if response and hasattr(response, 'text') else str(response)

            return ResponseNormalizer.normalize_success(
                raw_data=text_content,
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=full_prompt,
                completion_text=text_content,
                metadata={"status": "complete"}
            )
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"GeminiProvider generate_content failed: {e}")
            return ResponseNormalizer.normalize_error(
                error_msg=str(e),
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=prompt,
                metadata={"error_type": type(e).__name__}
            )

    def parse_resume_text(self, text: str, schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_resume_extraction_prompt(text)
        return self._execute_structured_prompt(prompt, schema_class, "resume_extraction")

    def normalize_skills(self, raw_skills: List[str], schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_skill_normalization_prompt(raw_skills)
        return self._execute_structured_prompt(prompt, schema_class, "skill_normalization")

    def match_career(self, user_skills: List[str], target_role: str, experience_years: float, schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_career_matching_prompt(user_skills, target_role, experience_years)
        return self._execute_structured_prompt(prompt, schema_class, "career_matching")

    def calculate_readiness(self, user_skills: List[str], required_skills: List[str], role_title: str, schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_readiness_prompt(user_skills, required_skills, role_title)
        return self._execute_structured_prompt(prompt, schema_class, "readiness_scoring")

    def generate_recommendations(self, user_skills: List[str], career_goal: str, learning_style: str, schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_recommendation_prompt(user_skills, career_goal, learning_style)
        return self._execute_structured_prompt(prompt, schema_class, "recommendation_generation")

    def generate_roadmap(self, current_level: str, target_role: str, target_months: int, schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_roadmap_prompt(current_level, target_role, target_months)
        return self._execute_structured_prompt(prompt, schema_class, "roadmap_generation")

    def generate_analytics(self, user_id: str, skills_trend: List[Dict[str, Any]], schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_analytics_prompt(user_id, skills_trend)
        return self._execute_structured_prompt(prompt, schema_class, "analytics_insights")

    def analyze_resume_intelligence(self, resume_text: str, target_role: Optional[str], schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_resume_intelligence_prompt(resume_text, target_role)
        return self._execute_structured_prompt(prompt, schema_class, "resume_intelligence")
