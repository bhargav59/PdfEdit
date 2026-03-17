"""Split handler — extract specific pages from a PDF."""

from __future__ import annotations

from pypdf import PdfReader, PdfWriter
from redis import Redis

from worker.utils import get_file_path, get_output_path, update_job_status


def _parse_page_ranges(page_ranges: str, total_pages: int) -> list[int]:
    """Parse a human-readable page-range string into 0-indexed page numbers.

    Accepted formats (1-indexed, inclusive):
        ``"1-3,5,7-10"`` -> [0, 1, 2, 4, 6, 7, 8, 9]

    Pages that exceed *total_pages* are silently clamped / ignored.
    """
    pages: list[int] = []
    for part in page_ranges.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start_str, end_str = part.split("-", 1)
            start = max(int(start_str.strip()), 1)
            end = min(int(end_str.strip()), total_pages)
            pages.extend(range(start - 1, end))  # convert to 0-indexed
        else:
            page_num = int(part.strip())
            if 1 <= page_num <= total_pages:
                pages.append(page_num - 1)  # convert to 0-indexed
    return pages


def split_handler(job_data: dict, r: Redis) -> None:
    """Extract pages from a PDF according to *options['page_ranges']*.

    If ``page_ranges`` is not provided every page is included (effectively a
    copy, but useful as a no-op default).
    """
    job_id: str = job_data["job_id"]
    file_ids: list[str] = job_data["file_ids"]
    options: dict = job_data.get("options", {})

    file_path = get_file_path(file_ids[0])
    reader = PdfReader(str(file_path))
    total_pages = len(reader.pages)

    page_ranges_str: str | None = options.get("page_ranges")
    if page_ranges_str:
        page_indices = _parse_page_ranges(page_ranges_str, total_pages)
    else:
        # Default: include all pages
        page_indices = list(range(total_pages))

    writer = PdfWriter()
    for idx in page_indices:
        writer.add_page(reader.pages[idx])

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
