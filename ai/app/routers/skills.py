import time
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from app.schemas.skill import RawSkillList
from app.skill_intelligence.semantic_skill_engine import SemanticSkillEngine
from app.utils.response_normalizer import ResponseNormalizer

router = APIRouter(
    prefix="/api/v1/skills",
    tags=["skills"]
)
logger = logging.getLogger("skillbridge-ai")

@router.post("/normalize")
@router.post("/analyze")
async def normalize_skills(request: RawSkillList):
    """
    Analyzes raw skills via SemanticSkillEngine into canonical taxonomy, proficiency, relationships,
    transferable capabilities, emerging tech tags, and functional domain clusters.
    Maintains 100% backward compatibility (`normalized_skills` root key) alongside UnifiedAIResponse.
    """
    start_time = time.time()
    if not request.skills:
        empty_resp = ResponseNormalizer.normalize_success(
            raw_data={"normalized_skills": [], "skill_clusters": {}, "total_skills_analyzed": 0, "emerging_skills_detected": 0},
            provider="semantic_skill_engine",
            model="semantic-skill-intelligence-v1",
            latency_ms=0.0
        )
        content_dict = empty_resp.model_dump()
        content_dict["normalized_skills"] = []
        return JSONResponse(status_code=200, content=content_dict)
        
    try:
        logger.info(f"[Skills Router] Executing SemanticSkillEngine for {len(request.skills)} skills...")
        analysis_result = SemanticSkillEngine.analyze_skills(request.skills, request.context_text or "")
        latency = (time.time() - start_time) * 1000

        unified_resp = ResponseNormalizer.normalize_success(
            raw_data=analysis_result,
            provider="semantic_skill_engine",
            model="semantic-skill-intelligence-v1",
            latency_ms=latency,
            prompt_text=str(request.skills),
            completion_text=str(analysis_result),
            metadata={"skill_count": len(request.skills), "engine": "semantic_skill_intelligence"}
        )

        resp_dict = unified_resp.model_dump()
        # Merge normalized_skills directly onto root level for backward compatibility with Node.js client
        resp_dict["normalized_skills"] = analysis_result["normalized_skills"]
        resp_dict["skill_clusters"] = analysis_result["skill_clusters"]

        return JSONResponse(status_code=200, content=resp_dict)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in normalize skills endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
