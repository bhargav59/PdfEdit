"""End-to-end merge flow test.

This test exercises the full pipeline: upload → create job → poll → download → verify.
Requires a running stack (docker compose up).
"""

import os
import time

import httpx
import pytest

API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000")
FIXTURES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fixtures")


@pytest.fixture
def client():
    with httpx.Client(base_url=API_BASE_URL, timeout=30.0) as c:
        yield c


def test_merge_flow_end_to_end(client):
    """Upload 2 PDFs, merge them, download, verify page count = 6."""

    # Step 1: Upload 1-page.pdf
    with open(os.path.join(FIXTURES_DIR, "1-page.pdf"), "rb") as f:
        resp = client.post("/upload", files={"file": ("1-page.pdf", f, "application/pdf")})
    assert resp.status_code == 200
    file_id_1 = resp.json()["file_id"]

    # Step 2: Upload 5-page.pdf
    with open(os.path.join(FIXTURES_DIR, "5-page.pdf"), "rb") as f:
        resp = client.post("/upload", files={"file": ("5-page.pdf", f, "application/pdf")})
    assert resp.status_code == 200
    file_id_2 = resp.json()["file_id"]

    # Step 3: Create merge job
    resp = client.post("/jobs", json={
        "tool": "merge",
        "file_ids": [file_id_1, file_id_2],
    })
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    assert resp.json()["status"] == "queued"

    # Step 4: Poll until completed (max 30s)
    for _ in range(30):
        resp = client.get(f"/jobs/{job_id}")
        assert resp.status_code == 200
        status = resp.json()["status"]
        if status == "completed":
            break
        if status == "failed":
            pytest.fail(f"Job failed with error: {resp.json().get('error')}")
        time.sleep(1)
    else:
        pytest.fail("Job did not complete within 30 seconds")

    # Step 5: Download the result
    resp = client.get(f"/download/{job_id}")
    assert resp.status_code == 200
    assert len(resp.content) > 0
    assert "attachment" in resp.headers.get("content-disposition", "")

    # Step 6: Verify the merged PDF has 6 pages
    import tempfile
    from pypdf import PdfReader

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(resp.content)
        tmp_path = tmp.name

    try:
        reader = PdfReader(tmp_path)
        assert len(reader.pages) == 6, f"Expected 6 pages, got {len(reader.pages)}"
    finally:
        os.unlink(tmp_path)
