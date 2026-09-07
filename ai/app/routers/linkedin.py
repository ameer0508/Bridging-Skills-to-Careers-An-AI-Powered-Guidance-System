from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.linkedin_intelligence.linkedin_engine import linkedin_intelligence_instance

router = APIRouter(prefix="/api/v1/linkedin", tags=["LinkedIn Intelligence"])

@router.get("/analyze/{profile_id}")
async def analyze_linkedin_profile(profile_id: str):
    """
    Analyzes LinkedIn professional identity, experience progression, skill endorsements, and branding.
    """
    try:
        data = linkedin_intelligence_instance.analyze_profile(profile_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
