from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.portfolio_intelligence.portfolio_engine import portfolio_intelligence_instance

router = APIRouter(prefix="/api/v1/portfolio", tags=["Portfolio Intelligence"])

@router.get("/analyze")
async def analyze_portfolio_website(
    url: str = Query("https://alexmercer.dev", description="Portfolio website URL to evaluate"),
    skills: Optional[List[str]] = Query(None, description="Resume skills list to cross-verify against live project showcases"),
):
    """
    Analyzes live portfolio websites, UI/UX aesthetics, case studies, technology stacks, & deployment platforms.
    """
    try:
        data = portfolio_intelligence_instance.analyze_portfolio(url, target_skills=skills)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
