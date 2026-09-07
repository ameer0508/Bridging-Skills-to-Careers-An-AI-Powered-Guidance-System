import os
import shutil
import tempfile
import time
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.services.extractor import extract_text_from_file
from app.resume_intelligence.parser_pipeline import ResumeIntelligencePipeline
from app.utils.response_normalizer import ResponseNormalizer
from app.core.logging import logger

router = APIRouter(prefix="/api/v1/extract", tags=["Extraction"])

@router.post("")
async def extract_resume(file: UploadFile = File(...)):
    """
    Accepts a resume file (PDF/DOCX), runs Transformer-Based Resume Intelligence Engine,
    and returns structured data matching standard UnifiedAIResponse envelope.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.doc', '.txt']:
        raise HTTPException(status_code=400, detail="Unsupported file format. Must be PDF, DOCX, or TXT.")

    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, file.filename)
    start_time = time.time()
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"[Resume Intelligence] Extracting text and analyzing layout from {file.filename}")
        text = extract_text_from_file(temp_path)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Failed to extract text from document or document is empty.")
            
        logger.info("[Resume Intelligence] Executing 14-stage Transformer Resume Intelligence Pipeline")
        parsed_data = ResumeIntelligencePipeline.execute(temp_path, text)
        latency = (time.time() - start_time) * 1000

        unified_resp = ResponseNormalizer.normalize_success(
            raw_data=parsed_data.model_dump(),
            provider="transformer_engine",
            model="transformer-resume-intelligence-v1",
            latency_ms=latency,
            prompt_text=text[:200],
            completion_text=str(parsed_data.model_dump()),
            metadata={"filename": file.filename, "parsing_engine": "transformer_pipeline"}
        )

        return JSONResponse(status_code=200, content=unified_resp.model_dump())
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in Resume Intelligence Extraction: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
