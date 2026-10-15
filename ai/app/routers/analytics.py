from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.core.security import require_acting_user
from app.schemas.modules import AnalyticsRequest
from app.services.analytics_service import generate_analytics_via_ai

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics Engine"])

# The user is named in the body (user_id), so the path-parameter check in verify_internal_request
# does not cover it: each route requires it to match the acting user the backend authenticated.

@router.post("/insights")
def generate_analytics(request: AnalyticsRequest, http_request: Request):
    require_acting_user(http_request, request.user_id)
    ai_resp = generate_analytics_via_ai(request)
    return JSONResponse(status_code=200 if ai_resp.success else 500, content=ai_resp.model_dump())

@router.post("/simulate")
def simulate_scenario(request: AnalyticsRequest, http_request: Request):
    require_acting_user(http_request, request.user_id)
    ai_resp = generate_analytics_via_ai(request)
    return JSONResponse(status_code=200 if ai_resp.success else 500, content=ai_resp.model_dump())
