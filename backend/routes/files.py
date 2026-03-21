"""File deletion and metadata endpoints: DELETE /files/{id}, GET /files/{id}/font."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend import storage
from backend.font_utils import suggest_font_from_pdf

router = APIRouter()


@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    deleted = storage.delete_file(file_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="File not found")
    return {"deleted": True}


@router.get("/files/{file_id}/font")
async def get_suggested_font(file_id: str):
    """Analyze the PDF to suggest the most appropriate font for editing."""
    path = storage.get_file_path(file_id)
    if not path or not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    font = suggest_font_from_pdf(path)
    return {"font": font}
