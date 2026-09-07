from fastapi import APIRouter, Query, HTTPException
from app.networking_agent.networking_agent import networking_agent_instance

router = APIRouter(prefix="/api/v1/networking-agent", tags=["Autonomous Networking Agent"])

@router.get("/recommend/{user_id}")
async def run_networking_cycle(
    user_id: str,
    target_company: str = Query("OpenScale AI Systems", description="Target company for networking"),
    target_skill: str = Query("Vector Indexing & Milvus Architecture", description="Target skill/tech area")
):
    """
    Runs an autonomous networking cycle generating connection recommendations, alumni matches, & outreach drafts.
    """
    try:
        data = networking_agent_instance.run_networking_cycle(user_id, target_company=target_company, target_skill=target_skill)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
