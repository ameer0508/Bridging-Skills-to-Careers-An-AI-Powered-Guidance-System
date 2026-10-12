# NOTE: this module has no live data source. It returns built-in illustrative sample data,
# labelled as such in every response. It is not used by the product's user workflows.
ILLUSTRATIVE = "illustrative_sample"
from fastapi import APIRouter, Query, HTTPException
from app.learning_agent.learning_agent import learning_agent_instance

router = APIRouter(prefix="/api/v1/learning-agent", tags=["Autonomous Learning Agent"])

@router.get("/run/{user_id}")
async def run_learning_agent_cycle(
    user_id: str,
    target_skill: str = Query("Vector Indexing & Milvus Architecture", description="Target skill to learn & optimize")
):
    """
    Runs an autonomous learning cycle generating curriculum, scheduling labs, & optimizing learning journey.
    """
    try:
        data = learning_agent_instance.run_learning_cycle(user_id, target_skill=target_skill)
        return {"success": True, "data_origin": ILLUSTRATIVE, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
