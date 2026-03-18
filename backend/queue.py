"""Redis queue and job record management."""

from __future__ import annotations

import json
from datetime import datetime, timezone

import redis as redis_lib
from rq import Queue

from backend.config import REDIS_URL


def get_redis() -> redis_lib.Redis:
    kwargs = {"decode_responses": True}
    if REDIS_URL.startswith("rediss://"):
        kwargs["ssl_cert_reqs"] = "none"
    return redis_lib.Redis.from_url(REDIS_URL, **kwargs)


def create_job_record(
    job_id: str,
    tool: str,
    file_ids: list[str],
    options: dict,
) -> None:
    """Create the full job hash in Redis."""
    r = get_redis()
    now = datetime.now(timezone.utc).isoformat()
    r.hset(
        f"job:{job_id}",
        mapping={
            "job_id": job_id,
            "tool": tool,
            "status": "queued",
            "file_ids": json.dumps(file_ids),
            "options": json.dumps(options),
            "output_path": "",
            "error": "",
            "progress": 0,
            "created_at": now,
            "updated_at": now,
        },
    )


def enqueue_job(job_id: str) -> None:
    """Push the job onto the rq queue for worker consumption."""
    r = get_redis()
    kwargs = {}
    if REDIS_URL.startswith("rediss://"):
        kwargs["ssl_cert_reqs"] = "none"
    q = Queue("pdf-jobs", connection=redis_lib.Redis.from_url(REDIS_URL, **kwargs))
    # Import the shared task function — rq needs a reference it can serialize.
    from shared.tasks import process_job

    q.enqueue(process_job, job_id)


def get_job(job_id: str) -> dict | None:
    """Read the full job hash from Redis. Returns None if not found."""
    r = get_redis()
    data = r.hgetall(f"job:{job_id}")
    if not data:
        return None
    # Coerce progress to int
    data["progress"] = int(data.get("progress", 0))
    return data


def update_job(job_id: str, **fields: str | int) -> None:
    r = get_redis()
    fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    r.hset(f"job:{job_id}", mapping=fields)
