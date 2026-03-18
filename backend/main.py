"""FastAPI application entry point."""

from __future__ import annotations

import sys
import logging
from contextlib import asynccontextmanager
from pathlib import Path

# Ensure project root is on sys.path for shared module imports
_project_root = str(Path(__file__).resolve().parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import CORS_ORIGINS, STORAGE_PATH
from backend.cleanup import cleanup_expired_files
from backend.routes import upload, jobs, download, files

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    (STORAGE_PATH / "uploads").mkdir(parents=True, exist_ok=True)
    (STORAGE_PATH / "output").mkdir(parents=True, exist_ok=True)
    logger.info("Storage directories ensured at %s", STORAGE_PATH)

    scheduler.add_job(cleanup_expired_files, "interval", minutes=10)
    scheduler.start()
    logger.info("Cleanup scheduler started (every 10 minutes)")

    yield

    # Shutdown
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="PDF Processing SaaS API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(jobs.router)
app.include_router(download.router)
app.include_router(files.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
