"""TTL-based cleanup of expired files and job records."""

from __future__ import annotations

import logging
import time
from pathlib import Path

from backend.config import FILE_TTL_SECONDS, STORAGE_PATH
from backend.queue import get_redis

logger = logging.getLogger(__name__)


def cleanup_expired_files() -> None:
    """Delete upload and output files older than FILE_TTL_SECONDS."""
    now = time.time()
    cutoff = now - FILE_TTL_SECONDS
    r = get_redis()

    for subdir in ("uploads", "output"):
        directory = STORAGE_PATH / subdir
        if not directory.exists():
            continue
        for filepath in directory.iterdir():
            if filepath.is_file() and filepath.stat().st_mtime < cutoff:
                logger.info("Cleaning up expired file: %s", filepath)
                filepath.unlink(missing_ok=True)

    # Also clean Redis job keys whose files have been deleted
    for key in r.scan_iter("job:*"):
        job = r.hgetall(key)
        if not job:
            continue
        created = job.get("created_at", "")
        if not created:
            continue
        try:
            from datetime import datetime, timezone

            created_dt = datetime.fromisoformat(created)
            age = (datetime.now(timezone.utc) - created_dt).total_seconds()
            if age > FILE_TTL_SECONDS:
                logger.info("Cleaning up expired job: %s", key)
                r.delete(key)
        except (ValueError, TypeError):
            pass
