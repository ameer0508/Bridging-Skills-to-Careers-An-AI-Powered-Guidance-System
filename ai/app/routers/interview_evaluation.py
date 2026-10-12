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
INTERVIEW_CATEGORIES = {"technical", "behavioral", "project", "resume", "career"}
INTERVIEW_DIFFICULTIES = {"easy", "medium", "hard"}


class InterviewQuestionsRequest(BaseModel):
    role_title: str = Field(..., min_length=1, max_length=160)
    mode: str = Field(default="mixed", max_length=20)
    count: int = Field(default=5, ge=1, le=10)
    skills: List[str] = Field(default_factory=list, max_length=60)
    gaps: List[str] = Field(default_factory=list, max_length=30)
    experience: List[str] = Field(default_factory=list, max_length=20)
    projects: List[str] = Field(default_factory=list, max_length=20)
    job_title: str = Field(default="", max_length=200)
    job_company: str = Field(default="", max_length=200)
    job_description: str = Field(default="", max_length=8000)
    avoid: List[str] = Field(default_factory=list, max_length=30)


class GeneratedInterviewQuestion(BaseModel):
    question: str = Field(..., min_length=15, max_length=600)
    category: str
    difficulty: str = "medium"
    expected_concepts: List[str] = Field(default_factory=list)
    grounded_in: str = Field(default="", max_length=200)


class InterviewQuestionSet(BaseModel):
    questions: List[GeneratedInterviewQuestion]


def _clean_generated_questions(raw: dict, count: int, avoid: List[str]) -> Optional[List[dict]]:
    """
    Validates provider output. Returns None when it is unusable so the caller can answer 503;
    questions are never padded or invented here.
    """
    try:
        parsed = InterviewQuestionSet.model_validate(raw)
    except Exception:
        return None
    seen = {" ".join(q.lower().split()) for q in avoid}
    cleaned: List[dict] = []
    for item in parsed.questions:
        text = " ".join(item.question.split())
        key = text.lower()
        category = item.category.strip().lower()
        if key in seen or category not in INTERVIEW_CATEGORIES:
            continue
        seen.add(key)
        difficulty = item.difficulty.strip().lower()
        cleaned.append({
            "question": text,
            "category": category,
            "difficulty": difficulty if difficulty in INTERVIEW_DIFFICULTIES else "medium",
            "expected_concepts": [c.strip()[:80] for c in item.expected_concepts if c and c.strip()][:5],
            "grounded_in": item.grounded_in.strip(),
        })
    return cleaned[:count] if len(cleaned) >= count else None


@router.post("/questions")
async def generate_interview_questions(request: InterviewQuestionsRequest):
    """
    Generates interview questions for one candidate using a real AI provider.

    Like /evaluate, this endpoint has no mock or canned output: without a provider, or when the
    provider's output fails validation, it returns 503 and the backend uses its own labelled
    question bank.
    """
    unavailable = JSONResponse(status_code=503, content={"success": False, "error": "AI question generation is unavailable."})

    try:
        capable = [p for p in ai_gateway.get_provider_chain() if hasattr(p, "generate_interview_questions")]
    except Exception:
        capable = []
    if not capable:
        return unavailable

    try:
        response = ai_gateway.route_request(
            service_name="interview_question_generation",
            method_name="generate_interview_questions",
            payload={"context": request.model_dump()},
            schema_class=InterviewQuestionSet,
        )
    except Exception as exc:
        logger.warning(f"[Interview Questions] No AI provider available: {exc}")
        return unavailable

    if not response.success or not response.response:
        return unavailable

    questions = _clean_generated_questions(response.response, request.count, request.avoid)
    if questions is None:
        logger.warning("[Interview Questions] Provider output failed validation; reporting unavailable.")
        return unavailable

    return {
        "success": True,
        "provider": response.provider,
        "model": response.model,
        "data": {"questions": questions},
    }
