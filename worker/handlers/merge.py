"""Merge handler — combine multiple PDFs into one."""

from __future__ import annotations

from pypdf import PdfReader, PdfWriter
from redis import Redis

from worker.utils import get_file_path, get_output_path, update_job_status


def merge_handler(job_data: dict, r: Redis) -> None:
    """Merge all PDF files referenced by *job_data['file_ids']* into a single PDF.

    Uses ``pypdf.PdfWriter`` (not the deprecated PdfMerger) to append every
    page from each source PDF in order.
    """
    job_id: str = job_data["job_id"]
    file_ids: list[str] = job_data["file_ids"]

    writer = PdfWriter()

    for file_id in file_ids:
        file_path = get_file_path(file_id)
        reader = PdfReader(str(file_path))
        for page in reader.pages:
            writer.add_page(page)

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
