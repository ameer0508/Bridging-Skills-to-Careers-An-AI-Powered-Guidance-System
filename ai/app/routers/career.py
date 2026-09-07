from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.schemas.modules import CareerMatchRequest
from app.services.career_matching_service import match_career_via_ai

router = APIRouter(prefix="/api/v1/career", tags=["Career Matching"])

@router.post("/match")
async def match_career(request: CareerMatchRequest):
    ai_resp = match_career_via_ai(request)
    return JSONResponse(status_code=200 if ai_resp.success else 500, content=ai_resp.model_dump())
