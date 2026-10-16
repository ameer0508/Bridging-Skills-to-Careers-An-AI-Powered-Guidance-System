import os
import re
import json
import time
import logging
import threading
import urllib.request
import urllib.error
from typing import Any, List, Dict, Optional, Tuple
from urllib.parse import urlparse, urlunparse
from app.cost_policy import ProviderBlockedError, runtime_policy, validate_local_model_endpoint, validate_ollama_model
from app.providers.base_provider import BaseAIProvider
from app.schemas.ai_response import UnifiedAIResponse
from app.prompts.prompt_manager import PromptManager
from app.utils.response_normalizer import ResponseNormalizer

logger = logging.getLogger("skillbridge-ai")

# How long a "model is downloaded" answer from Ollama is trusted, and a "not downloaded" one
MODEL_CHECK_TTL_SECONDS = 30.0
MODEL_MISSING_TTL_SECONDS = 5.0
MODEL_CHECK_TIMEOUT_SECONDS = 2.0

THINK_BLOCK = re.compile(r"<think>.*?</think>", re.DOTALL)

# Marks a refusal for lack of capacity, so callers can say "busy" rather than "unavailable"
BUSY_MARKER = "LOCAL_MODEL_BUSY"


def _max_pending() -> int:
    try:
        return max(1, int(os.getenv("LOCAL_MODEL_MAX_PENDING", "2")))
    except ValueError:
        return 2


# Global limit on local generations in progress or waiting, shared by every route. The Ollama
# server answers one request at a time (OLLAMA_NUM_PARALLEL=1) at about 37 s for a typical chat on
# this CPU, so a third waiting request finishes near the 120 s timeout and a fourth always times
# out (measured). Beyond the limit a request is refused at once as busy instead of waiting to fail.
_capacity = threading.BoundedSemaphore(_max_pending())


class LocalModelBusy(RuntimeError):
    pass


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """A local model server has no reason to redirect; following one could leave this machine."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise urllib.error.HTTPError(req.full_url, code, "Redirect refused for the local model endpoint.", headers, fp)


# No proxy (an HTTP(S)_PROXY variable must not carry local prompts elsewhere) and no redirects
_opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), _NoRedirect())


def _env_number(name: str, default: float, minimum: float) -> float:
    try:
        return max(minimum, float(os.getenv(name, str(default))))
    except ValueError:
        return default


class LocalModelAdapter(BaseAIProvider):
    """
    Local Model Provider Adapter for Ollama HTTP endpoints: loopback, or the Ollama service on the
    Docker Compose stack's internal network.
    """

    def __init__(self, model_name: str = "llama3"):
        self._model_name = os.getenv("LOCAL_MODEL_NAME", model_name)
        self.endpoint = os.getenv("LOCAL_MODEL_ENDPOINT", "http://localhost:11434/api/generate")
        self._model_check: Optional[Tuple[float, bool]] = None
        self._model_check_lock = threading.Lock()

    @property
    def provider_name(self) -> str:
        return "local"

    @property
    def default_model(self) -> str:
        return self._model_name

    @staticmethod
    def timeout_seconds() -> float:
        return _env_number("LOCAL_MODEL_TIMEOUT_SECONDS", 120.0, 5.0)

    @staticmethod
    def num_ctx() -> int:
        return int(_env_number("LOCAL_MODEL_NUM_CTX", 8192, 1024))

    @staticmethod
    def chat_max_tokens() -> int:
        return int(_env_number("LOCAL_MODEL_MAX_TOKENS", 384, 16))

    @staticmethod
    def structured_max_tokens() -> int:
        return int(_env_number("LOCAL_MODEL_STRUCTURED_MAX_TOKENS", 768, 16))

    def _check_local_only(self) -> List[str]:
        """
        Raises unless the endpoint is on this machine (or the Docker Ollama service) and the model
        is a local one. Returns the validated addresses for a Docker service name.
        """
        addresses = validate_local_model_endpoint(self.endpoint)
        validate_ollama_model(self._model_name)
        if os.getenv("OLLAMA_API_KEY"):
            raise ValueError("OLLAMA_API_KEY is set: Ollama cloud access is not allowed; unset it to use local models.")
        decision = runtime_policy.check(self.provider_name)
        if not decision.allowed:
            raise ProviderBlockedError(decision)
        return addresses

    def _url(self, path: str, addresses: List[str]) -> Tuple[str, Dict[str, str]]:
        """
        The URL to request, pinned to an address validated a moment ago so the name is not
        resolved again (a changed DNS answer cannot redirect the call), plus the Host header.
        """
        parsed = urlparse(self.endpoint)
        if not addresses:
            return urlunparse(parsed._replace(path=path)), {}
        address = addresses[0]
        literal = f"[{address}]" if ":" in address else address
        return urlunparse(parsed._replace(netloc=f"{literal}:{parsed.port}", path=path)), {"Host": parsed.netloc}

    def _request(self, path: str, addresses: List[str], timeout: float, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url, headers = self._url(path, addresses)
        data = None
        if payload is not None:
            data = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, headers=headers, method="POST" if payload is not None else "GET")
        try:
            with _opener.open(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            # Ollama explains failures (e.g. an unknown model) in a JSON "error" field
            detail = ""
            try:
                detail = json.loads(exc.read().decode("utf-8")).get("error", "")
            except Exception:
                pass
            raise RuntimeError(f"Local model server returned HTTP {exc.code}{': ' + detail if detail else ''}") from exc

    def _model_downloaded(self, addresses: List[str]) -> bool:
        """Asks Ollama whether the configured model is downloaded. Answers are cached briefly."""
        with self._model_check_lock:
            now = time.time()
            if self._model_check is not None:
                checked_at, present = self._model_check
                if now - checked_at < (MODEL_CHECK_TTL_SECONDS if present else MODEL_MISSING_TTL_SECONDS):
                    return present
            try:
                tags = self._request("/api/tags", addresses, MODEL_CHECK_TIMEOUT_SECONDS)
                names = {m.get(key) for m in tags.get("models", []) for key in ("name", "model")}
                present = self._model_name in names
                if not present:
                    logger.warning(f"LocalModelAdapter: model '{self._model_name}' is not downloaded on the local model server.")
            except Exception as exc:
                logger.warning(f"LocalModelAdapter: local model server unreachable ({exc.__class__.__name__}).")
                present = False
            self._model_check = (now, present)
            return present

    def is_available(self) -> bool:
        if os.getenv("ENABLE_LOCAL_MODEL", "false").lower() != "true":
            return False
        try:
            addresses = self._check_local_only()
        except (ValueError, ProviderBlockedError) as exc:
            logger.warning(f"LocalModelAdapter disabled: {exc}")
            return False
        return self._model_downloaded(addresses)

    def _call_local_api(self, prompt: str, num_predict: int, response_format: Optional[Dict[str, Any]] = None) -> Tuple[str, Dict[str, Any]]:
        """One generation. Returns the reply text and Ollama's own measurements; raises on any failure."""
        addresses = self._check_local_only()
        num_ctx = self.num_ctx()
        # Certainly longer than the context window: Ollama would silently drop its beginning
        if len(prompt) > num_ctx * 4:
            raise ValueError(f"Prompt is too long for the local model's {num_ctx}-token context window.")
        payload: Dict[str, Any] = {
            "model": self._model_name,
            "prompt": prompt,
            "stream": False,
            "options": {"num_ctx": num_ctx, "num_predict": num_predict},
        }
        if response_format is not None:
            payload["format"] = response_format
        if not _capacity.acquire(blocking=False):
            raise LocalModelBusy(f"{BUSY_MARKER}: the local model is already handling {_max_pending()} requests.")
        try:
            data = self._request("/api/generate", addresses, self.timeout_seconds(), payload)
        finally:
            _capacity.release()
        if data.get("error"):
            raise RuntimeError(f"Local model error: {data['error']}")
        text = data.get("response")
        if not isinstance(text, str):
            raise RuntimeError("Local model returned no text.")
        prompt_tokens = data.get("prompt_eval_count")
        # Ollama keeps only the end of a prompt that does not fit, losing the instructions at its start
        if isinstance(prompt_tokens, int) and prompt_tokens + num_predict > num_ctx:
            raise ValueError(f"Prompt did not fit the local model's {num_ctx}-token context window.")
        text = THINK_BLOCK.sub("", text).strip()
        if not text:
            raise RuntimeError("Local model returned an empty reply.")
        stats = {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": data.get("eval_count"),
            "done_reason": data.get("done_reason"),
        }
        return text, stats

    @staticmethod
    def _usage(stats: Dict[str, Any]) -> Optional[Dict[str, int]]:
        if stats.get("prompt_tokens") is None:
            return None
        return {"prompt_tokens": stats["prompt_tokens"], "completion_tokens": stats.get("completion_tokens") or 0}

    def _execute_prompt(self, prompt: str, schema_class: Any, tag: str) -> UnifiedAIResponse:
        start_time = time.time()
        try:
            # Ollama constrains the output to the schema; it is still validated here, and anything
            # that does not validate is a failure, never a partial success
            raw_text, stats = self._call_local_api(prompt, self.structured_max_tokens(), schema_class.model_json_schema())
            latency = (time.time() - start_time) * 1000
            if stats.get("done_reason") == "length":
                raise ValueError(f"Structured output was cut off at {self.structured_max_tokens()} tokens.")
            try:
                parsed_data = schema_class.model_validate_json(raw_text)
            except Exception as exc:
                raise ValueError(f"Structured output did not match the {schema_class.__name__} schema.") from exc

            return ResponseNormalizer.normalize_success(
                raw_data=parsed_data.model_dump(),
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=prompt,
                completion_text=raw_text,
                metadata={"parsing_engine": tag},
                actual_usage=self._usage(stats),
            )
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"LocalModelAdapter {tag} failed: {e}")
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
            result, stats = self._call_local_api(full_prompt, self.chat_max_tokens())
            latency = (time.time() - start_time) * 1000
            metadata: Dict[str, Any] = {}
            if stats.get("done_reason") == "length":
                # A real reply that hit the length cap; flagged rather than hidden
                metadata["truncated"] = True
            return ResponseNormalizer.normalize_success(
                raw_data=result,
                provider=self.provider_name,
                model=self._model_name,
                latency_ms=latency,
                prompt_text=full_prompt,
                completion_text=result,
                metadata=metadata,
                actual_usage=self._usage(stats),
            )
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"LocalModelAdapter generate_content failed: {e}")
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
