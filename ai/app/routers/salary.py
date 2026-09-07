from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from app.salary_intelligence.salary_engine import salary_engine_instance
from app.salary_intelligence.salary_provider import SalaryFilter

router = APIRouter(prefix="/api/v1/salary", tags=["Salary Intelligence"])

@router.get("/intelligence")
async def get_salary_intelligence(
    job_title: Optional[str] = Query(None, description="Target job title to benchmark"),
    location: Optional[str] = Query(None, description="Geographic location or Remote"),
    experience_level: Optional[str] = Query(None, description="Junior, Mid, Senior, Lead, Principal"),
    skills: Optional[List[str]] = Query(None, description="List of verified skills"),
    industry: Optional[str] = Query(None, description="Industry sector"),
):
    """
    Returns unified salary analytics, AI compensation predictions, regional comparisons, and telemetry.
    """
    try:
        filter_params = SalaryFilter(
            job_title=job_title,
            location=location,
            experience_level=experience_level,
            skills=skills or [],
            industry=industry,
        )
        result = salary_engine_instance.get_salary_intelligence(filter_params)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
