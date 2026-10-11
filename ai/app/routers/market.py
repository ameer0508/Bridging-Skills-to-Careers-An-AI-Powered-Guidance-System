# NOTE: this module has no live data source. It returns built-in illustrative sample data,
# labelled as such in every response. It is not used by the product's user workflows.
ILLUSTRATIVE = "illustrative_sample"
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.market_intelligence.market_engine import market_engine_instance
from app.market_intelligence.trend_provider import TrendFilter

router = APIRouter(prefix="/api/v1/market", tags=["Market Intelligence"])

@router.get("/trends")
async def get_market_trends(
    category: Optional[str] = Query(None, description="Category filter (AI Frameworks, DevOps, Cloud, etc.)"),
    query: Optional[str] = Query(None, description="Skill or technology search term"),
    country: Optional[str] = Query("United States", description="Geographic country filter"),
    city: Optional[str] = Query(None, description="City location filter"),
    remote_only: bool = Query(False, description="Filter for 100% remote roles"),
):
    """
    Returns unified labor market trends, emerging tech forecasts, hiring velocity, and opportunity scores.
    """
    try:
        filter_params = TrendFilter(
            category=category,
            query=query,
            country=country,
            city=city,
            remote_only=remote_only,
        )
        result = market_engine_instance.get_market_intelligence(filter_params)
        return {"success": True, "data_origin": ILLUSTRATIVE, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
