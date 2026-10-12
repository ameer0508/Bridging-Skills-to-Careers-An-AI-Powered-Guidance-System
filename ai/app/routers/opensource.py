# NOTE: this module has no live data source. It returns built-in illustrative sample data,
# labelled as such in every response. It is not used by the product's user workflows.
ILLUSTRATIVE = "illustrative_sample"
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.opensource_intelligence.opensource_engine import opensource_intelligence_instance

router = APIRouter(prefix="/api/v1/opensource", tags=["Open Source Intelligence"])

@router.get("/analyze/{username}")
async def analyze_opensource_contributor(
    username: str,
    skills: Optional[List[str]] = Query(None, description="Resume skills list to cross-verify against open-source commit history"),
):
    """
    Analyzes open-source ecosystem contributions, PR merge rates, code reviews, maintainer status, & community influence.
    """
    try:
        data = opensource_intelligence_instance.analyze_contributor(username, target_skills=skills)
        return {"success": True, "data_origin": ILLUSTRATIVE, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
