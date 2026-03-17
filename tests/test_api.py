"""Backend API integration tests."""

import time
import httpx
import pytest


class TestUpload:
    def test_upload_valid_pdf(self, client, fixture_path):
        path = fixture_path("1-page.pdf")
        with open(path, "rb") as f:
            resp = client.post("/upload", files={"file": ("test.pdf", f, "application/pdf")})
        assert resp.status_code == 200
        data = resp.json()
        assert "file_id" in data
        assert data["filename"] == "test.pdf"
        assert data["size"] > 0

    def test_upload_invalid_type(self, client):
        resp = client.post(
            "/upload",
            files={"file": ("test.txt", b"hello world", "text/plain")},
        )
        assert resp.status_code == 422
        assert "detail" in resp.json()

    def test_upload_too_large(self, client):
        # Create content just over 50MB
        large_content = b"0" * (52_428_800 + 1)
        resp = client.post(
            "/upload",
            files={"file": ("big.pdf", large_content, "application/pdf")},
        )
        assert resp.status_code == 413
        assert "detail" in resp.json()


class TestJobs:
    def test_create_merge_job(self, client, upload_file):
        fid1 = upload_file("1-page.pdf")
        fid2 = upload_file("5-page.pdf")
        resp = client.post("/jobs", json={
            "tool": "merge",
            "file_ids": [fid1, fid2],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "job_id" in data
        assert data["status"] == "queued"

    def test_create_job_missing_files(self, client):
        resp = client.post("/jobs", json={
            "tool": "merge",
            "file_ids": ["nonexistent1", "nonexistent2"],
        })
        assert resp.status_code == 404

    def test_get_job_status(self, client, upload_file):
        fid1 = upload_file("1-page.pdf")
        fid2 = upload_file("5-page.pdf")
        create_resp = client.post("/jobs", json={
            "tool": "merge",
            "file_ids": [fid1, fid2],
        })
        job_id = create_resp.json()["job_id"]
        resp = client.get(f"/jobs/{job_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] in ("queued", "processing", "completed", "failed")

    def test_get_nonexistent_job(self, client):
        resp = client.get("/jobs/00000000000000000000000000000000")
        assert resp.status_code == 404


class TestDownload:
    def test_download_completed_job(self, client, upload_file):
        fid1 = upload_file("1-page.pdf")
        fid2 = upload_file("5-page.pdf")
        create_resp = client.post("/jobs", json={
            "tool": "merge",
            "file_ids": [fid1, fid2],
        })
        job_id = create_resp.json()["job_id"]

        # Poll until completed (max 30s)
        for _ in range(30):
            status_resp = client.get(f"/jobs/{job_id}")
            status = status_resp.json()["status"]
            if status == "completed":
                break
            if status == "failed":
                pytest.fail(f"Job failed: {status_resp.json().get('error')}")
            time.sleep(1)
        else:
            pytest.fail("Job did not complete within 30 seconds")

        resp = client.get(f"/download/{job_id}")
        assert resp.status_code == 200
        assert len(resp.content) > 0
        assert "attachment" in resp.headers.get("content-disposition", "")

    def test_download_not_ready(self, client, upload_file):
        fid1 = upload_file("1-page.pdf")
        fid2 = upload_file("5-page.pdf")
        create_resp = client.post("/jobs", json={
            "tool": "merge",
            "file_ids": [fid1, fid2],
        })
        job_id = create_resp.json()["job_id"]
        # Immediately try to download without waiting
        resp = client.get(f"/download/{job_id}")
        # Should be 400 (not completed) or 200 (if worker was very fast)
        assert resp.status_code in (200, 400)
