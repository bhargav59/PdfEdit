"""Upload endpoint: POST /upload."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, UploadFile, File

from backend.config import MAX_FILE_SIZE
from backend.models import ALLOWED_CONTENT_TYPES, FileUploadResponse
from backend import storage

router = APIRouter()


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}",
        )

    # Read to check size (save_file also reads, so we reset after)
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large: {len(content)} bytes. Maximum: {MAX_FILE_SIZE} bytes.",
        )

    # Reset file position so save_file can read it
    await file.seek(0)

    file_id, filename, size = await storage.save_file(file)
    return FileUploadResponse(file_id=file_id, filename=filename, size=size)
