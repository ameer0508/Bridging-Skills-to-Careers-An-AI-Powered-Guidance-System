from typing import List, Optional
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from app.core.logging import logger
from app.gateway.ai_gateway import ai_gateway

router = APIRouter(prefix="/api/v1/interview", tags=["Interview Evaluation"])


class InterviewEvaluationRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    answer: str = Field(..., min_length=1, max_length=8000)
    category: str = Field(default="technical", max_length=40)
    role_title: str = Field(default="", max_length=160)
    expected_concepts: List[str] = Field(default_factory=list, max_length=12)


class InterviewEvaluation(BaseModel):
    """Structured rubric result. Every criterion is an integer 0-5."""
    relevance: int = Field(..., ge=0, le=5)
    completeness: int = Field(..., ge=0, le=5)
    specificity: int = Field(..., ge=0, le=5)
    structure: int = Field(..., ge=0, le=5)
    technical_accuracy: Optional[int] = Field(default=None, ge=0, le=5)
    is_relevant: bool = True
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    feedback: str = ""


@router.post("/evaluate")
async def evaluate_interview_answer(request: InterviewEvaluationRequest):
    """
    Evaluates one interview answer against an explicit rubric using a real AI provider.

    There is deliberately no mock or canned result for this endpoint: when no provider can
    produce a validated evaluation it returns 503, and the caller falls back to its own
    clearly labelled rule-based scoring.
    """
    unavailable = JSONResponse(status_code=503, content={"success": False, "error": "AI evaluation is unavailable."})

    # Answer immediately when no configured provider can evaluate (e.g. only the mock is active)
    try:
        capable = [p for p in ai_gateway.get_provider_chain() if hasattr(p, "evaluate_interview_answer")]
    except Exception:
        capable = []
    if not capable:
        return unavailable

    try:
        response = ai_gateway.route_request(
            service_name="interview_evaluation",
            method_name="evaluate_interview_answer",
            payload={
                "question": request.question,
                "category": request.category,
                "expected_concepts": request.expected_concepts,
                "role_title": request.role_title,
                "answer": request.answer,
            },
            schema_class=InterviewEvaluation,
        )
    except Exception as exc:  # e.g. no provider configured at all
        logger.warning(f"[Interview Evaluation] No AI provider available: {exc}")
        return JSONResponse(status_code=503, content={"success": False, "error": "AI evaluation is unavailable."})

    if not response.success or not response.response:
        return JSONResponse(status_code=503, content={"success": False, "error": "AI evaluation is unavailable."})

    return {
        "success": True,
        "provider": response.provider,
        "model": response.model,
        "data": response.response,
    }
