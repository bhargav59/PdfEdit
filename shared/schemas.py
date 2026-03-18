"""Shared Pydantic v2 models and constants for the PDF Processing SaaS.

This module is the single source of truth for all data structures.
Imported by backend (models.py) and worker (utils.py).
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

# ── Constants ──────────────────────────────────────────────────────────────────

MAX_FILE_SIZE = 52_428_800  # 50 MB
FILE_TTL_SECONDS = 7200  # 2 hours

ALLOWED_TOOLS = ("merge", "split", "compress", "convert", "edit")

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
}

TOOL_EXT_MAP = {
    "merge": "pdf",
    "split": "pdf",
    "compress": "pdf",
    "convert": None,  # determined by options.convert_to
    "edit": "pdf",
}

# ── Request / Response Models ──────────────────────────────────────────────────

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    size: int


class JobCreateRequest(BaseModel):
    tool: Literal["merge", "split", "compress", "convert", "edit"]
    file_ids: list[str]
    options: dict = Field(default_factory=dict)


class JobCreateResponse(BaseModel):
    job_id: str
    status: str = "queued"


class JobDetail(BaseModel):
    job_id: str
    tool: str
    status: Literal["queued", "processing", "completed", "failed"]
    progress: int = 0
    output_path: str | None = None
    error: str | None = None
    created_at: str
    updated_at: str


class ErrorResponse(BaseModel):
    detail: str
