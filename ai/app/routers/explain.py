"""
Explanations of rule-based results, written by the local model only.

The facts are personal, so only the local model may receive them: the route is restricted to the
'local' provider, and no external provider or the development mock is ever tried instead. A reply
is returned only if it passes every check in app/explanations; otherwise the caller gets a labelled
failure (busy, unavailable, timeout or rejected) and nothing is invented.
"""
import os
import time
from typing import Any, Dict, List

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.logging import logger
from app.explanations.career_match import PROMPT_VERSION, build_prompt, build_retry_prompt, validate_explanation
from app.gateway.ai_gateway import ai_gateway
from app.providers.local_adapter import BUSY_MARKER
from app.schemas.explanation import CareerMatchExplanationRequest

router = APIRouter(prefix="/api/v1/explain", tags=["Explanations"])

SERVICE_NAME = "career_match_explanation"  # not in NON_PERSONAL_SERVICES: treated as personal data
LOCAL = "local"


def _failure(status: int, code: str, error: str, **extra) -> JSONResponse:
    headers = {"Retry-After": "60"} if code == "AI_BUSY" else None
    return JSONResponse(status_code=status, headers=headers, content={"success": False, "code": code, "error": error, **extra})


def _local_available() -> bool:
    try:
        chain = ai_gateway.get_provider_chain(LOCAL)
    except Exception:
        return False
    return any(p.provider_name == LOCAL for p in chain)


def _attempts() -> int:
    try:
        return max(1, min(3, int(os.getenv("EXPLANATION_MAX_ATTEMPTS", "2"))))
    except ValueError:
        return 2


def _retry_budget_seconds() -> float:
    """No retry is started after this long, so both attempts stay well inside the backend's 130 s wait."""
    try:
        return max(0.0, float(os.getenv("EXPLANATION_RETRY_BUDGET_SECONDS", "45")))
    except ValueError:
        return 45.0


def _add_usage(total: Dict[str, Any], usage: Dict[str, Any]) -> Dict[str, Any]:
    """Tokens of every attempt count: each one was a real generation."""
    if not total:
        return dict(usage)
    out = dict(total)
    for key in ("prompt_tokens", "completion_tokens", "total_tokens", "estimated_cost_usd"):
        out[key] = (total.get(key) or 0) + (usage.get(key) or 0)
    if usage.get("source") != "provider":
        out["source"] = usage.get("source")
    return out


@router.post("/career-match")
def explain_career_match(request: CareerMatchExplanationRequest):
    """
    Synchronous on purpose, like chat: FastAPI runs it in a worker thread, so a slow local model
    does not hold up the event loop.

    A reply that fails the checks gets one more attempt (EXPLANATION_MAX_ATTEMPTS, default 2), with
    the reasons added to the prompt. Every attempt is checked; if none passes, the caller gets a
    labelled rejection and no text.
    """
    facts = request.facts
    if not _local_available():
        ai_gateway.record_unavailable(SERVICE_NAME, "local_model_unavailable")
        return _failure(503, "AI_UNAVAILABLE", "The local AI model is unavailable.")

    usage: Dict[str, Any] = {}
    latency = 0.0
    reasons: List[str] = []
    attempts = _attempts()
    started = time.monotonic()
    attempt = 0
    while attempt < attempts:
        attempt += 1
        if attempt > 1 and time.monotonic() - started > _retry_budget_seconds():
            attempt -= 1
            break
        prompt = build_prompt(facts) if attempt == 1 else build_retry_prompt(facts, reasons)
        try:
            response = ai_gateway.route_request(
                service_name=SERVICE_NAME,
                method_name="explain_facts",
                payload=prompt,
                requested_provider=LOCAL,
                restrict_to=[LOCAL],
                use_cache=False,
            )
        except Exception as exc:
            logger.warning(f"[Explain] No local provider: {exc}")
            return _failure(503, "AI_UNAVAILABLE", "The local AI model is unavailable.")

        if not response.success:
            errors = " ".join(response.errors)
            if BUSY_MARKER in errors:
                return _failure(503, "AI_BUSY", "The local AI model is busy; try again shortly.")
            if "timed out" in errors.lower() or "timeout" in errors.lower():
                return _failure(504, "AI_TIMEOUT", "The local AI model did not answer in time.")
            logger.warning(f"[Explain] Local model failed: {errors}")
            return _failure(503, "AI_UNAVAILABLE", "The local AI model is unavailable.")

        # Defence in depth: the chain was restricted to the local model, and that is checked again here
        if response.provider != LOCAL or not isinstance(response.response, str):
            logger.error(f"[Explain] Refused a reply from provider '{response.provider}'.")
            return _failure(503, "AI_UNAVAILABLE", "The local AI model is unavailable.")

        usage = _add_usage(usage, response.usage.model_dump())
        latency += response.latency
        if response.metadata.get("done_reason") == "length":
            reasons = ["was cut off at the length limit"]
        else:
            checked = validate_explanation(response.response, facts)
            if checked.passed:
                return {
                    "success": True,
                    "data": {"text": checked.text},
                    "provider": response.provider,
                    "model": response.model,
                    "latency": round(latency, 2),
                    "usage": usage,
                    "attempts": attempt,
                    "prompt_version": PROMPT_VERSION,
                    "validation": {"passed": True},
                }
            reasons = checked.reasons
        logger.info(f"[Explain] Attempt {attempt} rejected: {reasons}")

    return _failure(422, "EXPLANATION_REJECTED", "The explanation did not agree with the verified facts.",
                    reasons=reasons, attempts=attempt, provider=LOCAL, model=response.model, usage=usage)
