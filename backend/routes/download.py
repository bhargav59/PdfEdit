"""Download endpoint: GET /download/{id}."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from backend import queue

router = APIRouter()


@router.get("/download/{job_id}")
async def download_result(job_id: str):
    job = queue.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")

    output_path = job.get("output_path")
    if not output_path:
        raise HTTPException(status_code=400, detail="No output file available")

    path = Path(output_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Output file not found on disk")

    # Determine filename for Content-Disposition
    filename = path.name
    media_type = "application/octet-stream"
    if filename.endswith(".pdf"):
        media_type = "application/pdf"
    elif filename.endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(
        path=str(path),
        media_type=media_type,
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
