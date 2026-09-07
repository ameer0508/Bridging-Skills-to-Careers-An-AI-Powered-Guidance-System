from fastapi import APIRouter, HTTPException
from app.professional_brand.brand_engine import professional_brand_instance

router = APIRouter(prefix="/api/v1/brand", tags=["Professional Brand Intelligence"])

@router.get("/analyze/{user_id}")
async def analyze_professional_brand(user_id: str):
    """
    Evaluates professional identity, recruiter visibility, ATS keyword optimization, credibility, & cross-platform consistency.
    """
    try:
        data = professional_brand_instance.analyze_brand(user_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
