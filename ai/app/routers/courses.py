from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from app.course_intelligence.course_engine import course_engine_instance
from app.course_intelligence.provider_interface import CourseFilter

router = APIRouter(prefix="/api/v1/courses", tags=["Course Intelligence"])

@router.get("/intelligence")
async def get_course_intelligence(
    skill: Optional[str] = Query(None, description="Target skill or technology"),
    provider: Optional[str] = Query(None, description="Course provider (Coursera, edX, Udemy, etc.)"),
    difficulty: Optional[str] = Query(None, description="Beginner, Intermediate, Advanced, Expert"),
    max_price: Optional[float] = Query(None, description="Maximum price in USD"),
    requires_certificate: bool = Query(False, description="Filter for certificate availability"),
    target_skills: Optional[List[str]] = Query(None, description="Target skill gaps to cover"),
):
    """
    Returns multi-provider course discovery, multi-factor rank scores, structured learning paths, and ROI estimates.
    """
    try:
        filter_params = CourseFilter(
            skill=skill,
            provider=provider,
            difficulty=difficulty,
            max_price=max_price,
            requires_certificate=requires_certificate,
        )
        result = course_engine_instance.discover_and_rank_courses(
            filter_params=filter_params,
            target_skills=target_skills
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
