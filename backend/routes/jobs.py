"""Job endpoints: POST /jobs, GET /jobs/{id}."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException

from backend.models import (
    ALLOWED_TOOLS,
    JobCreateRequest,
    JobCreateResponse,
    JobDetail,
)
from backend import storage, queue

router = APIRouter()


@router.post("/jobs", response_model=JobCreateResponse)
async def create_job(request: JobCreateRequest):
    # Validate tool
    if request.tool not in ALLOWED_TOOLS:
        raise HTTPException(status_code=422, detail=f"Invalid tool: {request.tool}")

    # Validate file_ids exist
    for fid in request.file_ids:
        if not storage.file_exists(fid):
            raise HTTPException(status_code=404, detail=f"File not found: {fid}")

    # Validate file count per tool
    if request.tool == "merge" and len(request.file_ids) < 2:
        raise HTTPException(
            status_code=422,
            detail="Merge requires at least 2 files.",
        )
    if request.tool in ("split", "compress", "convert", "edit") and len(request.file_ids) != 1:
        raise HTTPException(
            status_code=422,
            detail=f"{request.tool.capitalize()} requires exactly 1 file.",
        )

    job_id = uuid.uuid4().hex

    # Create job record in Redis and enqueue for worker
    queue.create_job_record(job_id, request.tool, request.file_ids, request.options)
    queue.enqueue_job(job_id)

    return JobCreateResponse(job_id=job_id, status="queued")


@router.get("/jobs/{job_id}", response_model=JobDetail)
async def get_job_status(job_id: str):
    job = queue.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobDetail(
        job_id=job["job_id"],
        tool=job["tool"],
        status=job["status"],
        progress=int(job.get("progress", 0)),
        output_path=job.get("output_path") or None,
        error=job.get("error") or None,
        created_at=job["created_at"],
        updated_at=job["updated_at"],
    )
