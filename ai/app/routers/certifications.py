from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from app.certification_intelligence.certification_engine import certification_engine_instance
from app.certification_intelligence.provider_interface import CertificationFilter

router = APIRouter(prefix="/api/v1/certifications", tags=["Certification Intelligence"])

@router.get("/intelligence")
async def get_certification_intelligence(
    technology: Optional[str] = Query(None, description="Target technology or domain"),
    provider: Optional[str] = Query(None, description="Certification provider (Microsoft, AWS, GCP, Cisco, etc.)"),
    level: Optional[str] = Query(None, description="Associate, Professional, Expert, Specialty"),
    max_cost_usd: Optional[float] = Query(None, description="Maximum exam fee in USD"),
    target_skills: Optional[List[str]] = Query(None, description="Target skill gaps to cover"),
):
    """
    Returns multi-provider certification discovery, multi-factor rank scores, pathways, and salary ROI estimates.
    """
    try:
        filter_params = CertificationFilter(
            technology=technology,
            provider=provider,
            level=level,
            max_cost_usd=max_cost_usd,
        )
        result = certification_engine_instance.discover_and_rank_certifications(
            filter_params=filter_params,
            target_skills=target_skills
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
