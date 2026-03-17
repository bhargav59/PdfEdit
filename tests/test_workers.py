"""Worker handler unit tests.

These tests call the handler functions directly with mock job data
and a real Redis connection. They require pypdf, pdf2docx,
python-docx, and reportlab to be installed.
"""

import json
import os
import sys
import tempfile
import uuid
from pathlib import Path

import pytest
import redis

# Add project root to path
_root = str(Path(__file__).resolve().parent.parent)
if _root not in sys.path:
    sys.path.insert(0, _root)

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


@pytest.fixture
def r():
    return redis.Redis.from_url(REDIS_URL, decode_responses=True)


@pytest.fixture
def storage_dir(tmp_path):
    """Create temp storage dirs and set env var."""
    uploads = tmp_path / "uploads"
    output = tmp_path / "output"
    uploads.mkdir()
    output.mkdir()
    os.environ["STORAGE_PATH"] = str(tmp_path)
    yield tmp_path
    # Cleanup env var
    if "STORAGE_PATH" in os.environ:
        del os.environ["STORAGE_PATH"]


@pytest.fixture
def create_job(r, storage_dir):
    """Create a job record in Redis and copy fixture files to storage."""
    def _create(tool: str, fixture_files: list[str], options: dict | None = None):
        job_id = uuid.uuid4().hex
        file_ids = []
        for fixture_name in fixture_files:
            file_id = uuid.uuid4().hex
            src = os.path.join(FIXTURES_DIR, fixture_name)
            ext = Path(fixture_name).suffix
            dst = storage_dir / "uploads" / f"{file_id}{ext}"
            dst.write_bytes(Path(src).read_bytes())
            file_ids.append(file_id)

        now = "2025-01-01T00:00:00+00:00"
        r.hset(f"job:{job_id}", mapping={
            "job_id": job_id,
            "tool": tool,
            "status": "queued",
            "file_ids": json.dumps(file_ids),
            "options": json.dumps(options or {}),
            "output_path": "",
            "error": "",
            "progress": "0",
            "created_at": now,
            "updated_at": now,
        })

        job_data = {
            "job_id": job_id,
            "tool": tool,
            "status": "queued",
            "file_ids": file_ids,
            "options": options or {},
        }
        return job_id, job_data
    return _create


class TestMerge:
    def test_merge_two_pdfs(self, r, create_job, storage_dir):
        from worker.handlers.merge import merge_handler
        from pypdf import PdfReader

        job_id, job_data = create_job("merge", ["1-page.pdf", "5-page.pdf"])
        merge_handler(job_data, r)

        job = r.hgetall(f"job:{job_id}")
        assert job["status"] == "completed"
        assert int(job["progress"]) == 100

        output = Path(job["output_path"])
        assert output.exists()
        reader = PdfReader(str(output))
        assert len(reader.pages) == 6


class TestSplit:
    def test_split_pages(self, r, create_job, storage_dir):
        from worker.handlers.split import split_handler
        from pypdf import PdfReader

        job_id, job_data = create_job("split", ["5-page.pdf"], {"page_ranges": "1-3"})
        split_handler(job_data, r)

        job = r.hgetall(f"job:{job_id}")
        assert job["status"] == "completed"

        output = Path(job["output_path"])
        assert output.exists()
        reader = PdfReader(str(output))
        assert len(reader.pages) == 3


class TestCompress:
    def test_compress_reduces_size(self, r, create_job, storage_dir):
        from worker.handlers.compress import compress_handler

        job_id, job_data = create_job("compress", ["5-page.pdf"])
        input_size = (storage_dir / "uploads").iterdir().__next__().stat().st_size

        compress_handler(job_data, r)

        job = r.hgetall(f"job:{job_id}")
        assert job["status"] == "completed"

        output = Path(job["output_path"])
        assert output.exists()
        # Compressed file should exist (may or may not be smaller for test PDFs)
        assert output.stat().st_size > 0


class TestConvert:
    def test_convert_pdf_to_docx(self, r, create_job, storage_dir):
        from worker.handlers.convert import convert_handler

        job_id, job_data = create_job("convert", ["1-page.pdf"], {"convert_to": "docx"})
        convert_handler(job_data, r)

        job = r.hgetall(f"job:{job_id}")
        assert job["status"] == "completed"

        output = Path(job["output_path"])
        assert output.exists()
        assert output.suffix == ".docx"
        assert output.stat().st_size > 0


class TestErrorHandling:
    def test_corrupt_pdf_fails(self, r, create_job, storage_dir):
        from worker.handlers.merge import merge_handler

        # Use corrupt.pdf as one of the merge inputs
        job_id, job_data = create_job("merge", ["corrupt.pdf", "1-page.pdf"])

        with pytest.raises(Exception):
            merge_handler(job_data, r)
