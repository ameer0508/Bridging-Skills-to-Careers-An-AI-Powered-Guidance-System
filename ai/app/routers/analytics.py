from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.schemas.modules import AnalyticsRequest
from app.services.analytics_service import generate_analytics_via_ai

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics Engine"])

@router.post("/insights")
async def generate_analytics(request: AnalyticsRequest):
    ai_resp = generate_analytics_via_ai(request)
    return JSONResponse(status_code=200 if ai_resp.success else 500, content=ai_resp.model_dump())

@router.post("/simulate")
async def simulate_scenario(request: AnalyticsRequest):
    ai_resp = generate_analytics_via_ai(request)
    return JSONResponse(status_code=200 if ai_resp.success else 500, content=ai_resp.model_dump())
