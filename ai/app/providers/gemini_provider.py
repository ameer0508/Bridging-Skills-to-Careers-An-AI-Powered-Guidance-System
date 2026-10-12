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

def _reported_usage(response: Any) -> Optional[Dict[str, int]]:
    """Token counts reported by Gemini for a response, when present."""
    meta = getattr(response, "usage_metadata", None)
    prompt_tokens = getattr(meta, "prompt_token_count", None) if meta is not None else None
    if prompt_tokens is None:
        return None
    return {
        "prompt_tokens": prompt_tokens,
        "completion_tokens": getattr(meta, "candidates_token_count", None) or 0,
    }


class GeminiProvider(BaseAIProvider):
    """
    Google GenAI / Gemini Provider Adapter for SkillBridge AI Intelligence Layer.
    """

    def __init__(self, model_name: Optional[str] = None):
        self._model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
        self.api_key = os.getenv("GEMINI_API_KEY")
        if GENAI_AVAILABLE and self.api_key:
            self.client = genai.Client(api_key=self.api_key, http_options=self._http_options())
        else:
            if not self.api_key:
                logger.warning("GEMINI_API_KEY is not set. Client initialization deferred.")
            if not GENAI_AVAILABLE:
                logger.warning("google-genai package not available.")
            self.client = None

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def default_model(self) -> str:
        return self._model_name

    def _candidate_models(self) -> List[str]:
        """
        The configured model, followed only by fallbacks the operator listed explicitly in
        GEMINI_FALLBACK_MODELS (comma separated). No other model is ever substituted silently.
        """
        models = [self._model_name]
        for alt in os.getenv("GEMINI_FALLBACK_MODELS", "").split(","):
            alt = alt.strip()
            if alt and alt not in models:
                models.append(alt)
        return models

    def _note_fallback(self, model: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Records, visibly, when a model other than the configured one produced the answer."""
        if model != self._model_name:
            metadata["model_fallback_from"] = self._model_name
            logger.warning(
                f"GeminiProvider: configured model '{self._model_name}' failed; answered by fallback '{model}'."
            )
        return metadata

    def is_available(self) -> bool:
        return bool(GENAI_AVAILABLE and (self.api_key or os.getenv("GEMINI_API_KEY")))

    @staticmethod
    def _http_options() -> Dict[str, Any]:
        """Request timeout for every Gemini call, in the milliseconds the SDK expects."""
        try:
            seconds = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "20"))
        except ValueError:
            seconds = 20.0
        return {"timeout": int(max(1.0, seconds) * 1000)}

    def _get_client(self) -> genai.Client:
        if not self.client:
            key = os.getenv("GEMINI_API_KEY")
            if not key:
                raise ValueError("GEMINI_API_KEY is not set in the environment.")
            self.client = genai.Client(api_key=key, http_options=self._http_options())
        return self.client

    def _execute_structured_prompt(self, prompt: str, schema_class: Any, metadata_tag: str) -> UnifiedAIResponse:
        start_time = time.time()
        client = self._get_client()
        candidate_models = self._candidate_models()

        last_error = None
        for model in candidate_models:
            try:
                response = client.models.generate_content(
                    model=model,
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
                    model=model,
                    latency_ms=latency,
                    prompt_text=prompt,
                    completion_text=response.text,
                    metadata=self._note_fallback(model, {"parsing_engine": metadata_tag}),
                    actual_usage=_reported_usage(response)
                )
            except Exception as e:
                last_error = e
                logger.warning(f"GeminiProvider {metadata_tag} failed with model {model}: {e}")
                if "503" in str(e) or "404" in str(e):
                    continue
                break

        latency = (time.time() - start_time) * 1000
        logger.error(f"GeminiProvider {metadata_tag} failed across models: {last_error}")
        return ResponseNormalizer.normalize_error(
            error_msg=str(last_error),
            provider=self.provider_name,
            model=self._model_name,
            latency_ms=latency,
            prompt_text=prompt,
            metadata={"error_type": type(last_error).__name__, "tag": metadata_tag}
        )

    def generate_content(self, prompt: str, **kwargs) -> UnifiedAIResponse:
        start_time = time.time()
        client = self._get_client()
        candidate_models = self._candidate_models()

        last_error = None
        full_prompt = PromptManager.get_career_architect_prompt(prompt)
        for model in candidate_models:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=full_prompt,
                )
                latency = (time.time() - start_time) * 1000
                text_content = response.text if response and hasattr(response, 'text') else str(response)

                return ResponseNormalizer.normalize_success(
                    raw_data=text_content,
                    provider=self.provider_name,
                    model=model,
                    latency_ms=latency,
                    prompt_text=full_prompt,
                    completion_text=text_content,
                    metadata=self._note_fallback(model, {"status": "complete"}),
                    actual_usage=_reported_usage(response)
                )
            except Exception as e:
                last_error = e
                logger.warning(f"GeminiProvider generate_content failed with model {model}: {e}")
                if "503" in str(e) or "404" in str(e):
                    continue
                break

        latency = (time.time() - start_time) * 1000
        logger.error(f"GeminiProvider generate_content failed across models: {last_error}")
        return ResponseNormalizer.normalize_error(
            error_msg=str(last_error),
            provider=self.provider_name,
            model=self._model_name,
            latency_ms=latency,
            prompt_text=prompt,
            metadata={"error_type": type(last_error).__name__}
        )

    def evaluate_interview_answer(
        self, question: str, category: str, expected_concepts: List[str], role_title: str, answer: str, schema_class: Any
    ) -> UnifiedAIResponse:
        from app.prompts.interview_prompts import build_interview_evaluation_prompt
        prompt = build_interview_evaluation_prompt(question, category, expected_concepts, role_title, answer)
        return self._execute_structured_prompt(prompt, schema_class, "interview_evaluation")

    def generate_interview_questions(self, context: Dict[str, Any], schema_class: Any) -> UnifiedAIResponse:
        from app.prompts.interview_prompts import build_interview_questions_prompt
        prompt = build_interview_questions_prompt(**context)
        return self._execute_structured_prompt(prompt, schema_class, "interview_question_generation")

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
