"""Re-export shared Pydantic models for use in backend routes."""

import sys
from pathlib import Path

# Ensure the project root (parent of backend/) is on sys.path so
# `shared.schemas` and `shared.tasks` are importable.
_project_root = str(Path(__file__).resolve().parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from shared.schemas import (  # noqa: E402, F401
    ALLOWED_CONTENT_TYPES,
    ALLOWED_TOOLS,
    MAX_FILE_SIZE,
    FILE_TTL_SECONDS,
    ErrorResponse,
    FileUploadResponse,
    JobCreateRequest,
    JobCreateResponse,
    JobDetail,
)
