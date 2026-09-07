from fastapi import APIRouter, Query, HTTPException
from app.memory_engine.memory_manager import long_term_memory_manager_instance

router = APIRouter(prefix="/api/v1/memory", tags=["Long-Term Memory Engine"])

@router.get("/context/{user_id}")
async def get_memory_context(user_id: str, agent_id: str = Query("orchestrator", description="Calling AI agent ID")):
    """
    Retrieves persistent, privacy-respecting memory context for an AI Agent.
    """
    try:
        data = long_term_memory_manager_instance.get_agent_memory_context(user_id, agent_id=agent_id)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/forget/{user_id}")
async def forget_memory_category(user_id: str, category: str = Query("episodic", description="Memory category to purge")):
    """
    Enforces GDPR Right-to-be-Forgotten by selectively purging user memory categories.
    """
    try:
        data = long_term_memory_manager_instance.forget_user_category(user_id, category)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
