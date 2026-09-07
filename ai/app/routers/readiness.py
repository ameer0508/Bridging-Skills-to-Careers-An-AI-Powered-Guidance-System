from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.schemas.modules import ReadinessRequest
from app.services.readiness_service import calculate_readiness_via_ai

router = APIRouter(prefix="/api/v1/readiness", tags=["Readiness Score"])

@router.post("/score")
async def calculate_readiness(request: ReadinessRequest):
    ai_resp = calculate_readiness_via_ai(request)
    return JSONResponse(status_code=200 if ai_resp.success else 500, content=ai_resp.model_dump())
