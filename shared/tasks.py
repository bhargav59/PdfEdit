"""Shared rq task entry point.

This module is importable by both the backend (for enqueue) and the worker
(for execution). Handler imports are lazy — they resolve only at execution
time inside the worker container, so the backend does not need worker code
on its Python path.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone

import redis as redis_lib


def _get_redis() -> redis_lib.Redis:
    return redis_lib.Redis.from_url(
        os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
        decode_responses=True,
    )


def process_job(job_id: str) -> None:
    """Process a PDF job. Called by rq on the worker."""
    r = _get_redis()
    job_key = f"job:{job_id}"

    job_data = r.hgetall(job_key)
    if not job_data:
        raise ValueError(f"Job {job_id} not found in Redis")

    # Deserialize JSON-encoded fields
    job_data["file_ids"] = json.loads(job_data.get("file_ids", "[]"))
    job_data["options"] = json.loads(job_data.get("options", "{}"))

    tool = job_data["tool"]

    # Lazy import — only resolves inside the worker container
    from worker.handlers import HANDLER_REGISTRY

    handler = HANDLER_REGISTRY.get(tool)
    if handler is None:
        _update_status(r, job_id, "failed", error=f"Unknown tool: {tool}")
        return

    try:
        _update_status(r, job_id, "processing", progress=0)
        handler(job_data, r)
    except Exception as e:
        _update_status(r, job_id, "failed", error=str(e))
        raise


def _update_status(
    r: redis_lib.Redis,
    job_id: str,
    status: str,
    *,
    progress: int | None = None,
    output_path: str | None = None,
    error: str | None = None,
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    fields: dict[str, str | int] = {"status": status, "updated_at": now}
    if progress is not None:
        fields["progress"] = progress
    if output_path is not None:
        fields["output_path"] = output_path
    if error is not None:
        fields["error"] = error
    r.hset(f"job:{job_id}", mapping=fields)
