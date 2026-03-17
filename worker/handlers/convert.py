"""Convert handler — PDF <-> DOCX conversion."""

from __future__ import annotations

from pathlib import Path

from redis import Redis

from worker.utils import get_file_path, get_output_path, update_job_status


# ---------------------------------------------------------------------------
# PDF -> DOCX  (uses pdf2docx)
# ---------------------------------------------------------------------------

def _pdf_to_docx(input_path: Path, output_path: Path) -> None:
    """Convert a PDF file to a Word .docx document via *pdf2docx*."""
    from pdf2docx import Converter

    cv = Converter(str(input_path))
    cv.convert(str(output_path))
    cv.close()


# ---------------------------------------------------------------------------
# DOCX -> PDF  (uses python-docx + reportlab)
# ---------------------------------------------------------------------------

def _docx_to_pdf(input_path: Path, output_path: Path) -> None:
    """Convert a Word .docx document to PDF using *python-docx* for reading
    and *reportlab* for writing.

    Each paragraph from the source document is rendered as a ``Paragraph``
    flowable in reportlab's Platypus layout engine, preserving basic text
    content (though complex formatting like tables and images is not carried
    over).
    """
    from docx import Document
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

    doc_reader = Document(str(input_path))

    pdf_doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=1 * inch,
        rightMargin=1 * inch,
        topMargin=1 * inch,
        bottomMargin=1 * inch,
    )

    styles = getSampleStyleSheet()

    # Create a heading style for paragraphs that look like headings
    heading_style = styles["Heading1"]
    normal_style = styles["Normal"]

    # Build a custom body style with a bit of extra leading for readability
    body_style = ParagraphStyle(
        "Body",
        parent=normal_style,
        leading=14,
        spaceAfter=6,
    )

    flowables: list = []

    for para in doc_reader.paragraphs:
        text = para.text.strip()
        if not text:
            flowables.append(Spacer(1, 6))
            continue

        # Escape XML special characters for reportlab
        text = (
            text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )

        # Detect heading styles from the source document
        if para.style and para.style.name and para.style.name.startswith("Heading"):
            flowables.append(Paragraph(text, heading_style))
        else:
            flowables.append(Paragraph(text, body_style))

    # Guard against empty documents — reportlab requires at least one flowable
    if not flowables:
        flowables.append(Spacer(1, 0))

    pdf_doc.build(flowables)


# ---------------------------------------------------------------------------
# Public handler
# ---------------------------------------------------------------------------

def convert_handler(job_data: dict, r: Redis) -> None:
    """Convert between PDF and DOCX formats.

    ``options.convert_to`` determines the direction:
        * ``"docx"`` (default) — PDF to Word
        * ``"pdf"`` — Word to PDF
    """
    job_id: str = job_data["job_id"]
    file_ids: list[str] = job_data["file_ids"]
    options: dict = job_data.get("options", {})

    convert_to: str = options.get("convert_to", "docx")
    file_path = get_file_path(file_ids[0])

    if convert_to == "docx":
        output_path = get_output_path(job_id, "docx")
        _pdf_to_docx(file_path, output_path)
    elif convert_to == "pdf":
        output_path = get_output_path(job_id, "pdf")
        _docx_to_pdf(file_path, output_path)
    else:
        raise ValueError(f"Unsupported convert_to value: {convert_to!r}")

    update_job_status(
        r,
        job_id,
        "completed",
        progress=100,
        output_path=str(output_path),
    )
