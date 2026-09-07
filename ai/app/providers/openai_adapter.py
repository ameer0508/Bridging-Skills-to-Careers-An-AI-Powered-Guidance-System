import os
import json
import time
import logging
import urllib.request
import urllib.error
from typing import Any, List, Dict, Optional
from app.providers.base_provider import BaseAIProvider
from app.schemas.ai_response import UnifiedAIResponse
from app.prompts.prompt_manager import PromptManager
from app.utils.response_normalizer import ResponseNormalizer

logger = logging.getLogger("skillbridge-ai")

class OpenAIAdapter(BaseAIProvider):
    """
    OpenAI API Provider Adapter for SkillBridge AI Intelligence Layer.
    """

    def __init__(self, model_name: str = "gpt-4o-mini"):
        self._model_name = os.getenv("OPENAI_MODEL", model_name)
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.base_url = "https://api.openai.com/v1/chat/completions"

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def default_model(self) -> str:
        return self._model_name

    def is_available(self) -> bool:
        return bool(self.api_key or os.getenv("OPENAI_API_KEY"))

    def _call_openai_api(self, prompt: str, is_json: bool = False) -> str:
        api_key = self.api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY is not set.")

        payload = {
            "model": self._model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }
        if is_json:
            payload["response_format"] = {"type": "json_object"}

        req = urllib.request.Request(
            self.base_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]

    def _execute_prompt(self, prompt: str, schema_class: Any, tag: str) -> UnifiedAIResponse:
        start_time = time.time()
        try:
            raw_json_str = self._call_openai_api(prompt, is_json=True)
            latency = (time.time() - start_time) * 1000
            parsed_data = schema_class.model_validate_json(raw_json_str)

            return ResponseNormalizer.normalize_success(
                raw_data=parsed_data.model_dump(),
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=prompt,
                completion_text=raw_json_str,
                metadata={"parsing_engine": tag}
            )
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"OpenAIAdapter {tag} failed: {e}")
            return ResponseNormalizer.normalize_error(
                error_msg=str(e),
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=prompt,
                metadata={"error_type": type(e).__name__, "tag": tag}
            )

    def generate_content(self, prompt: str, **kwargs) -> UnifiedAIResponse:
        start_time = time.time()
        try:
            full_prompt = PromptManager.get_career_architect_prompt(prompt)
            result = self._call_openai_api(full_prompt, is_json=False)
            latency = (time.time() - start_time) * 1000
            return ResponseNormalizer.normalize_success(
                raw_data=result,
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=full_prompt,
                completion_text=result
            )
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"OpenAIAdapter generate_content failed: {e}")
            return ResponseNormalizer.normalize_error(
                error_msg=str(e),
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=prompt
            )

    def parse_resume_text(self, text: str, schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_resume_extraction_prompt(text)
        return self._execute_prompt(prompt, schema_class, "resume_extraction")

    def normalize_skills(self, raw_skills: List[str], schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_skill_normalization_prompt(raw_skills)
        return self._execute_prompt(prompt, schema_class, "skill_normalization")

    def match_career(self, user_skills: List[str], target_role: str, experience_years: float, schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_career_matching_prompt(user_skills, target_role, experience_years)
        return self._execute_prompt(prompt, schema_class, "career_matching")

    def calculate_readiness(self, user_skills: List[str], required_skills: List[str], role_title: str, schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_readiness_prompt(user_skills, required_skills, role_title)
        return self._execute_prompt(prompt, schema_class, "readiness_scoring")

    def generate_recommendations(self, user_skills: List[str], career_goal: str, learning_style: str, schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_recommendation_prompt(user_skills, career_goal, learning_style)
        return self._execute_prompt(prompt, schema_class, "recommendation_generation")

    def generate_roadmap(self, current_level: str, target_role: str, target_months: int, schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_roadmap_prompt(current_level, target_role, target_months)
        return self._execute_prompt(prompt, schema_class, "roadmap_generation")

    def generate_analytics(self, user_id: str, skills_trend: List[Dict[str, Any]], schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_analytics_prompt(user_id, skills_trend)
        return self._execute_prompt(prompt, schema_class, "analytics_insights")

    def analyze_resume_intelligence(self, resume_text: str, target_role: Optional[str], schema_class: Any) -> UnifiedAIResponse:
        prompt = PromptManager.get_resume_intelligence_prompt(resume_text, target_role)
        return self._execute_prompt(prompt, schema_class, "resume_intelligence")
