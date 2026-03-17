"""Utility helpers for the PDF worker service."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path

from redis import Redis


def get_storage_path() -> Path:
    """Return the root storage directory from the STORAGE_PATH env var."""
    return Path(os.environ.get("STORAGE_PATH", "/storage"))


def get_file_path(file_id: str) -> Path:
    """Locate an uploaded file by its file_id prefix.

    Files are stored under ``{STORAGE_PATH}/uploads/`` with names that start
    with the ``file_id`` (e.g. ``abc123_original-name.pdf``).  This helper
    finds and returns the first matching path.

    Raises:
        FileNotFoundError: if no file with the given prefix exists.
    """
    uploads_dir = get_storage_path() / "uploads"
    if not uploads_dir.exists():
        raise FileNotFoundError(f"Uploads directory does not exist: {uploads_dir}")

    matches = list(uploads_dir.glob(f"{file_id}*"))
    if not matches:
        raise FileNotFoundError(
            f"No uploaded file found for file_id '{file_id}' in {uploads_dir}"
        )
    return matches[0]


def get_output_path(job_id: str, ext: str) -> Path:
    """Return the output file path for a completed job.

    Creates the output directory if it does not yet exist.
    """
    output_dir = get_storage_path() / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir / f"{job_id}_output.{ext}"


def update_job_status(
    r: Redis,
    job_id: str,
    status: str,
    **kwargs: str | int,
) -> None:
    """Update the Redis hash for a job with status, timestamp, and extras.

    Common extra keyword arguments:
        progress (int): percentage 0-100
        output_path (str): path to the result file
        error (str): error message on failure
    """
    now = datetime.now(timezone.utc).isoformat()
    fields: dict[str, str | int] = {"status": status, "updated_at": now}
    for key, value in kwargs.items():
        if value is not None:
            fields[key] = value
    r.hset(f"job:{job_id}", mapping=fields)
