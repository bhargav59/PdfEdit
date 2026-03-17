"""Shared pytest fixtures and configuration."""

import os
import pytest
import httpx

API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")
FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


@pytest.fixture
def api_url():
    return API_BASE_URL


@pytest.fixture
def client():
    """Synchronous httpx client for API tests."""
    with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as c:
        yield c


@pytest.fixture
def fixture_path():
    """Return a function to get fixture file paths."""
    def _get(filename: str) -> str:
        path = os.path.join(FIXTURES_DIR, filename)
        assert os.path.exists(path), f"Fixture not found: {path}"
        return path
    return _get


@pytest.fixture
def upload_file(client, fixture_path):
    """Upload a fixture file and return the file_id."""
    def _upload(filename: str) -> str:
        path = fixture_path(filename)
        with open(path, "rb") as f:
            response = client.post(
                "/upload",
                files={"file": (filename, f, "application/pdf")},
            )
        assert response.status_code == 200, f"Upload failed: {response.text}"
        return response.json()["file_id"]
    return _upload
