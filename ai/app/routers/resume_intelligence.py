from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.schemas.modules import ResumeIntelligenceRequest
from app.services.resume_intelligence_service import analyze_resume_intelligence_via_ai

router = APIRouter(prefix="/api/v1/resume", tags=["Resume Intelligence"])

@router.post("/intelligence")
async def analyze_resume_intelligence(request: ResumeIntelligenceRequest):
    ai_resp = analyze_resume_intelligence_via_ai(request)
    return JSONResponse(status_code=200 if ai_resp.success else 500, content=ai_resp.model_dump())
