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

class HuggingFaceAdapter(BaseAIProvider):
    """
    HuggingFace Inference API Provider Adapter for SkillBridge.
    """

    def __init__(self, model_name: str = "mistralai/Mistral-7B-Instruct-v0.2"):
        self._model_name = os.getenv("HUGGINGFACE_MODEL", model_name)
        self.api_key = os.getenv("HUGGINGFACE_API_KEY")

    @property
    def provider_name(self) -> str:
        return "huggingface"

    @property
    def default_model(self) -> str:
        return self._model_name

    def is_available(self) -> bool:
        return bool(self.api_key or os.getenv("HUGGINGFACE_API_KEY"))

    def _call_hf_api(self, prompt: str) -> str:
        api_key = self.api_key or os.getenv("HUGGINGFACE_API_KEY")
        if not api_key:
            raise ValueError("HUGGINGFACE_API_KEY is not set.")

        url = f"https://api-inference.huggingface.co/models/{self._model_name}"
        payload = {"inputs": prompt, "parameters": {"max_new_tokens": 1024, "temperature": 0.1}}

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if isinstance(data, list) and len(data) > 0:
                return data[0].get("generated_text", str(data))
            return str(data)

    def _execute_prompt(self, prompt: str, schema_class: Any, tag: str) -> UnifiedAIResponse:
        start_time = time.time()
        try:
            raw_text = self._call_hf_api(prompt)
            latency = (time.time() - start_time) * 1000
            
            # Attempt to parse json from raw output
            try:
                json_start = raw_text.find('{')
                json_end = raw_text.rfind('}')
                if json_start != -1 and json_end != -1:
                    clean_json = raw_text[json_start:json_end+1]
                    parsed_data = schema_class.model_validate_json(clean_json)
                    result_dict = parsed_data.model_dump()
                else:
                    result_dict = {"raw_output": raw_text}
            except Exception:
                result_dict = {"raw_output": raw_text}

            return ResponseNormalizer.normalize_success(
                raw_data=result_dict,
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=prompt,
                completion_text=raw_text,
                metadata={"parsing_engine": tag}
            )
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"HuggingFaceAdapter {tag} failed: {e}")
            return ResponseNormalizer.normalize_error(
                error_msg=str(e),
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=prompt
            )

    def generate_content(self, prompt: str, **kwargs) -> UnifiedAIResponse:
        start_time = time.time()
        try:
            full_prompt = PromptManager.get_career_architect_prompt(prompt)
            result = self._call_hf_api(full_prompt)
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
            logger.error(f"HuggingFaceAdapter generate_content failed: {e}")
            return ResponseNormalizer.normalize_error(
                error_msg=str(e),
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=prompt
            )

    def parse_resume_text(self, text: str, schema_class: Any) -> UnifiedAIResponse:
        return self._execute_prompt(PromptManager.get_resume_extraction_prompt(text), schema_class, "resume_extraction")

    def normalize_skills(self, raw_skills: List[str], schema_class: Any) -> UnifiedAIResponse:
        return self._execute_prompt(PromptManager.get_skill_normalization_prompt(raw_skills), schema_class, "skill_normalization")

    def match_career(self, user_skills: List[str], target_role: str, experience_years: float, schema_class: Any) -> UnifiedAIResponse:
        return self._execute_prompt(PromptManager.get_career_matching_prompt(user_skills, target_role, experience_years), schema_class, "career_matching")

    def calculate_readiness(self, user_skills: List[str], required_skills: List[str], role_title: str, schema_class: Any) -> UnifiedAIResponse:
        return self._execute_prompt(PromptManager.get_readiness_prompt(user_skills, required_skills, role_title), schema_class, "readiness_scoring")

    def generate_recommendations(self, user_skills: List[str], career_goal: str, learning_style: str, schema_class: Any) -> UnifiedAIResponse:
        return self._execute_prompt(PromptManager.get_recommendation_prompt(user_skills, career_goal, learning_style), schema_class, "recommendation_generation")

    def generate_roadmap(self, current_level: str, target_role: str, target_months: int, schema_class: Any) -> UnifiedAIResponse:
        return self._execute_prompt(PromptManager.get_roadmap_prompt(current_level, target_role, target_months), schema_class, "roadmap_generation")

    def generate_analytics(self, user_id: str, skills_trend: List[Dict[str, Any]], schema_class: Any) -> UnifiedAIResponse:
        return self._execute_prompt(PromptManager.get_analytics_prompt(user_id, skills_trend), schema_class, "analytics_insights")

    def analyze_resume_intelligence(self, resume_text: str, target_role: Optional[str], schema_class: Any) -> UnifiedAIResponse:
        return self._execute_prompt(PromptManager.get_resume_intelligence_prompt(resume_text, target_role), schema_class, "resume_intelligence")
