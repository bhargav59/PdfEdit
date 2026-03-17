"""Local filesystem storage for uploaded and output files."""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import UploadFile

from backend.config import STORAGE_PATH


def _uploads_dir() -> Path:
    d = STORAGE_PATH / "uploads"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _output_dir() -> Path:
    d = STORAGE_PATH / "output"
    d.mkdir(parents=True, exist_ok=True)
    return d


async def save_file(upload_file: UploadFile) -> tuple[str, str, int]:
    """Save an uploaded file and return (file_id, original_filename, size)."""
    file_id = uuid.uuid4().hex
    filename = upload_file.filename or "upload"
    ext = Path(filename).suffix  # e.g. ".pdf"

    content = await upload_file.read()
    size = len(content)

    dest = _uploads_dir() / f"{file_id}{ext}"
    dest.write_bytes(content)

    return file_id, filename, size


def get_file_path(file_id: str) -> Path | None:
    """Find the uploaded file matching file_id prefix. Returns None if missing."""
    uploads = _uploads_dir()
    for p in uploads.iterdir():
        if p.name.startswith(file_id):
            return p
    return None


def file_exists(file_id: str) -> bool:
    return get_file_path(file_id) is not None


def delete_file(file_id: str) -> bool:
    """Delete an uploaded file. Returns True if deleted, False if not found."""
    path = get_file_path(file_id)
    if path is not None and path.exists():
        path.unlink()
        return True
    return False
