"""File deletion endpoint: DELETE /files/{id}."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend import storage

router = APIRouter()


@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    deleted = storage.delete_file(file_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="File not found")
    return {"deleted": True}
