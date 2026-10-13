"""
Multilingual resume analysis (E5, X1): detects the language, reads the layout and extracts
fields with provenance, for English, Hindi and Spanish. Internal only (called by the backend).
No OCR, translation or inference service is used; nothing leaves this process.
"""
import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.core.config import settings
from app.multilingual.document import from_text, read_document
from app.multilingual.extract import METHOD_VERSION, extract, supported_languages
from app.routers.extract import _CHUNK_SIZE, _safe_extension, _validate_content

router = APIRouter(prefix="/api/v1/multilingual", tags=["Multilingual"])

MAX_TEXT_CHARS = 100_000


class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_TEXT_CHARS)


@router.get("/languages")
async def languages():
    return {"success": True, "data": {"supported": supported_languages(), "method": METHOD_VERSION}}


@router.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    ext = _safe_extension(file.filename or "")
    fd, path = tempfile.mkstemp(suffix=ext)
    try:
        size = 0
        with os.fdopen(fd, "wb") as out:
            while chunk := await file.read(_CHUNK_SIZE):
                size += len(chunk)
                if size > settings.MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="File is too large.")
                out.write(chunk)
        if size == 0:
            raise HTTPException(status_code=400, detail="The file is empty.")
        _validate_content(path, ext)
        try:
            document = read_document(path, ext)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        except Exception:
            raise HTTPException(status_code=422, detail="The document could not be read.")
        return {"success": True, "data": {**extract(document), "fileType": ext.lstrip(".")}}
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


@router.post("/analyze-text")
async def analyze_text(body: TextRequest):
    return {"success": True, "data": {**extract(from_text(body.text)), "fileType": "text"}}
