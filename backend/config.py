"""Application settings loaded from environment variables."""

import os
from pathlib import Path


REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
CORS_ORIGINS: list[str] = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
STORAGE_PATH: Path = Path(os.environ.get("STORAGE_PATH", "/storage"))
MAX_FILE_SIZE: int = int(os.environ.get("MAX_FILE_SIZE", "52428800"))  # 50MB
FILE_TTL_SECONDS: int = int(os.environ.get("FILE_TTL_SECONDS", "7200"))  # 2 hours
