"""Worker entry point — starts an rq worker listening on the ``pdf-jobs`` queue.

Run with::

    python -m worker.main

or simply::

    python worker/main.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Ensure the project root (parent of worker/) is on sys.path so that
# ``shared.tasks`` and ``worker.handlers`` are importable.
# ---------------------------------------------------------------------------
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import redis as redis_lib
from rq import Worker, Queue


def main() -> None:
    """Connect to Redis and start the rq worker."""
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    
    kwargs = {}
    if redis_url.startswith("rediss://"):
        kwargs["ssl_cert_reqs"] = "none"
        
    conn = redis_lib.Redis.from_url(redis_url, **kwargs)

    queue = Queue("pdf-jobs", connection=conn)
    worker = Worker([queue], connection=conn)

    print(f"Worker starting — queue='pdf-jobs', redis={redis_url}")
    worker.work()


if __name__ == "__main__":
    main()
