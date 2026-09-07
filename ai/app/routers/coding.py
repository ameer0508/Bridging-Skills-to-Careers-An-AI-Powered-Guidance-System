from fastapi import APIRouter, HTTPException
from app.coding_intelligence.coding_engine import coding_intelligence_instance

router = APIRouter(prefix="/api/v1/coding", tags=["Coding Platform Intelligence"])

@router.get("/analyze/{username}")
async def analyze_coding_profile(username: str):
    """
    Aggregates coding profiles across LeetCode, Codeforces, HackerRank, CodeChef, & GeeksforGeeks.
    Computes FAANG interview readiness, contest ratings, & DSA topic mastery.
    """
    try:
        data = coding_intelligence_instance.analyze_profile(username)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
