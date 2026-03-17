"""Compress handler — reduce PDF file size."""

from __future__ import annotations

from pypdf import PdfReader, PdfWriter
from redis import Redis

from worker.utils import get_file_path, get_output_path, update_job_status


def compress_handler(job_data: dict, r: Redis) -> None:
    """Compress a PDF by deflating content streams and stripping metadata.

    Uses ``page.compress_content_streams()`` on every page and removes
    document-level metadata to reduce overall file size.
    """
    job_id: str = job_data["job_id"]
    file_ids: list[str] = job_data["file_ids"]

    file_path = get_file_path(file_ids[0])
    reader = PdfReader(str(file_path))

    writer = PdfWriter()
    for page in reader.pages:
        page.compress_content_streams()
        writer.add_page(page)

    # Strip document metadata to shave off a few more bytes
    writer.add_metadata({})

    output_path = get_output_path(job_id, "pdf")
    with open(output_path, "wb") as f:
        writer.write(f)

    update_job_status(
        r,
        job_id,
        "completed",
        progress=100,
        output_path=str(output_path),
    )
