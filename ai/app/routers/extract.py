import os
import shutil
import tempfile
import time
import zipfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.services.extractor import extract_text_from_file
from app.resume_intelligence.parser_pipeline import ResumeIntelligencePipeline
from app.utils.response_normalizer import ResponseNormalizer
from app.core.logging import logger

router = APIRouter(prefix="/api/v1/extract", tags=["Extraction"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
_CHUNK_SIZE = 64 * 1024


def _safe_extension(client_filename: str) -> str:
    """
    Returns the validated extension of the uploaded file.
    Only the extension of the client-supplied name is ever used; the name itself never
    becomes part of a filesystem path, so "../" sequences or absolute paths are harmless.
    """
    base_name = os.path.basename((client_filename or "").replace("\\", "/"))
    ext = os.path.splitext(base_name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file format. Must be PDF, DOCX, or TXT.")
    return ext


def _validate_content(path: str, ext: str) -> None:
    """Checks that the bytes on disk really are the declared document type."""
    with open(path, "rb") as fh:
        head = fh.read(8192)

    if ext == ".pdf":
        # The PDF header may be preceded by a few junk bytes, but must appear early
        if b"%PDF-" not in head[:1024]:
            raise HTTPException(status_code=415, detail="File content is not a valid PDF document.")
    elif ext == ".docx":
        if not head.startswith(b"PK") or not zipfile.is_zipfile(path):
            raise HTTPException(status_code=415, detail="File content is not a valid DOCX document.")
        with zipfile.ZipFile(path) as archive:
            if "word/document.xml" not in archive.namelist():
                raise HTTPException(status_code=415, detail="File content is not a valid DOCX document.")
    else:  # .txt
        if b"\x00" in head:
            raise HTTPException(status_code=415, detail="File content is not plain text.")


@router.post("")
async def extract_resume(file: UploadFile = File(...)):
    """
    Accepts a resume file (PDF/DOCX/TXT), extracts its text and returns structured data
    in the standard UnifiedAIResponse envelope.
    """
    ext = _safe_extension(file.filename or "")
    max_bytes = settings.MAX_UPLOAD_BYTES

    temp_dir = tempfile.mkdtemp(prefix="skillbridge-resume-")
    # Server-generated name inside a private temp directory
    temp_path = os.path.join(temp_dir, f"upload{ext}")
    start_time = time.time()

    try:
        total = 0
        with open(temp_path, "wb") as buffer:
            while True:
                chunk = await file.read(_CHUNK_SIZE)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds the {max_bytes // (1024 * 1024)} MB upload limit.",
                    )
                buffer.write(chunk)

        if total == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        _validate_content(temp_path, ext)

        logger.info(f"[Resume Intelligence] Extracting text from uploaded {ext} document ({total} bytes)")
        try:
            text = extract_text_from_file(temp_path)
        except ValueError as ve:
            raise HTTPException(status_code=422, detail=str(ve))

        if not text.strip():
            raise HTTPException(
                status_code=422,
                detail="No readable text found in the document. Scanned or image-only resumes are not supported.",
            )

        parsed_data = ResumeIntelligencePipeline.execute(temp_path, text)
        latency = (time.time() - start_time) * 1000

        unified_resp = ResponseNormalizer.normalize_success(
            raw_data=parsed_data.model_dump(),
            provider="rule_based_parser",
            model="resume-rules-v1",
            latency_ms=latency,
            model_invoked=False,
            metadata={"file_type": ext, "parsing_engine": "rule_based"}
        )

        return JSONResponse(status_code=200, content=unified_resp.model_dump())

    except HTTPException:
        raise
    except Exception as e:
        # Log the detail server-side; do not echo internal errors or paths to the caller
        logger.error(f"Error in Resume Intelligence Extraction: {e}")
        raise HTTPException(status_code=500, detail="Resume extraction failed.")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
