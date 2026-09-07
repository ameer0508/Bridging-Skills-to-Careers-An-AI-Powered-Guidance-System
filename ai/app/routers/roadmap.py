from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.schemas.modules import RoadmapRequest
from app.services.roadmap_service import generate_roadmap_via_ai

router = APIRouter(prefix="/api/v1/roadmap", tags=["Roadmap Generator"])

@router.post("/generate")
async def generate_roadmap(request: RoadmapRequest):
    ai_resp = generate_roadmap_via_ai(request)
    return JSONResponse(status_code=200 if ai_resp.success else 500, content=ai_resp.model_dump())
