"""Edit handler — apply visual annotations directly onto a PDF."""

from __future__ import annotations

from io import BytesIO

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from redis import Redis

from worker.utils import get_file_path, get_output_path, update_job_status

# Register custom fonts if available
FONTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "shared", "fonts")
_CUSTOM_FONTS = ["Roboto", "Lato", "Montserrat", "OpenSans"]
for _font in _CUSTOM_FONTS:
    _font_path = os.path.join(FONTS_DIR, f"{_font}-Regular.ttf")
    if os.path.exists(_font_path):
        try:
            pdfmetrics.registerFont(TTFont(_font, _font_path))
        except Exception as e:
            print(f"Warning: Could not register font {_font}: {e}")

def edit_handler(job_data: dict, r: Redis) -> None:
    """Apply text, drawing, highlight, and white-out operations to a PDF."""
    job_id: str = job_data["job_id"]
    file_ids: list[str] = job_data["file_ids"]
    options: dict = job_data.get("options", {})
    operations: list[dict] = options.get("operations", [])

    if not operations:
        raise ValueError("No edit operations provided")

    file_path = get_file_path(file_ids[0])
    reader = PdfReader(str(file_path))
    writer = PdfWriter()

    # Group operations by page index
    ops_by_page: dict[int, list[dict]] = {}
    for op in operations:
        page_idx = op["page"]
        ops_by_page.setdefault(page_idx, []).append(op)

    total_pages = len(reader.pages)
    for i, page in enumerate(reader.pages):
        if i in ops_by_page:
            overlay = _create_overlay(page, ops_by_page[i])
            overlay_reader = PdfReader(overlay)
            page.merge_page(overlay_reader.pages[0])

        writer.add_page(page)

        progress = int(((i + 1) / total_pages) * 100)
        update_job_status(r, job_id, "processing", progress=progress)

    output_path = get_output_path(job_id, "pdf")
    with open(output_path, "wb") as f:
        writer.write(f)

    update_job_status(
        r, job_id, "completed", progress=100, output_path=str(output_path)
    )


def _create_overlay(page, operations: list[dict]) -> BytesIO:
    """Create a single-page PDF overlay with all annotations for one page."""
    media_box = page.mediabox
    page_width = float(media_box.width)
    page_height = float(media_box.height)

    buf = BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(page_width, page_height))

    for op in operations:
        op_type = op["type"]
        if op_type == "add_text":
            _apply_text(c, op)
        elif op_type == "draw":
            _apply_draw(c, op)
        elif op_type == "highlight":
            _apply_highlight(c, op)
        elif op_type == "whiteout":
            _apply_whiteout(c, op)

    c.save()
    buf.seek(0)
    return buf


def _apply_text(c, op: dict) -> None:
    font = op.get("fontFamily", "Helvetica")
    size = op.get("fontSize", 14)
    color = op.get("color", "#000000")

    c.saveState()
    c.setFont(font, size)
    c.setFillColor(HexColor(color))
    c.drawString(op["x"], op["y"], op["text"])
    c.restoreState()


def _apply_draw(c, op: dict) -> None:
    points = op.get("points", [])
    if len(points) < 2:
        return

    c.saveState()
    c.setStrokeColor(HexColor(op.get("strokeColor", "#000000")))
    c.setLineWidth(op.get("strokeWidth", 2))
    c.setLineCap(1)  # round cap
    c.setLineJoin(1)  # round join

    path = c.beginPath()
    path.moveTo(points[0][0], points[0][1])
    for pt in points[1:]:
        path.lineTo(pt[0], pt[1])
    c.drawPath(path, fill=0, stroke=1)
    c.restoreState()


def _apply_highlight(c, op: dict) -> None:
    color = HexColor(op.get("color", "#FFFF00"))
    opacity = op.get("opacity", 0.35)

    c.saveState()
    c.setFillColor(color)
    c.setFillAlpha(opacity)
    c.rect(op["x"], op["y"], op["width"], op["height"], fill=1, stroke=0)
    c.restoreState()


def _apply_whiteout(c, op: dict) -> None:
    c.saveState()
    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(HexColor("#FFFFFF"))
    c.rect(op["x"], op["y"], op["width"], op["height"], fill=1, stroke=1)
    c.restoreState()
