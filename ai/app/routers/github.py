# NOTE: this module has no live data source. It returns built-in illustrative sample data,
# labelled as such in every response. It is not used by the product's user workflows.
ILLUSTRATIVE = "illustrative_sample"
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.github_intelligence.github_engine import github_intelligence_instance

router = APIRouter(prefix="/api/v1/github", tags=["GitHub Intelligence"])

@router.get("/analyze/{username}")
async def analyze_github_profile(
    username: str,
    skills: Optional[List[str]] = Query(None, description="Resume skills list to verify against repository evidence"),
):
    """
    Analyzes public GitHub repositories, architecture, commit activity, & verifies skill evidence.
    """
    try:
        data = github_intelligence_instance.analyze_profile(username, target_skills=skills)
        return {"success": True, "data_origin": ILLUSTRATIVE, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
