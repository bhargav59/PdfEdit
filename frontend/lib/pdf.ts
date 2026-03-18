// pdf.js initialization and coordinate helpers for the editor.
// All pdf.js imports are dynamic to avoid SSR issues in Next.js.

import type { PDFDocumentProxy } from "pdfjs-dist";

export type { PDFDocumentProxy };

let _initialized = false;

async function ensurePdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (!_initialized) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    _initialized = true;
  }
  return pdfjs;
}

export async function loadPdfDocument(
  source: string | ArrayBuffer
): Promise<PDFDocumentProxy> {
  const pdfjs = await ensurePdfJs();
  const loadingTask = pdfjs.getDocument(source);
  return loadingTask.promise;
}

/**
 * Convert canvas pixel coordinates to PDF point coordinates.
 * Canvas: origin top-left, Y down.
 * PDF: origin bottom-left, Y up.
 */
export function canvasToPdfCoords(
  canvasX: number,
  canvasY: number,
  scale: number,
  pageHeightPts: number
): { x: number; y: number } {
  return {
    x: canvasX / scale,
    y: pageHeightPts - canvasY / scale,
  };
}

/**
 * Convert PDF point coordinates back to canvas pixel coordinates.
 */
export function pdfToCanvasCoords(
  pdfX: number,
  pdfY: number,
  scale: number,
  pageHeightPts: number
): { x: number; y: number } {
  return {
    x: pdfX * scale,
    y: (pageHeightPts - pdfY) * scale,
  };
}

/**
 * Convert PDF Standard 14 font names to CSS properties.
 */
export function getCssFont(font: string): { fontWeight: string; fontStyle: string; fontFamily: string } {
  let fontWeight = "normal";
  let fontStyle = "normal";
  let family = font;

  if (family.includes("-Bold")) {
    fontWeight = "bold";
    family = family.replace("-Bold", "");
  }
  if (family.includes("-Oblique") || family.includes("-Italic")) {
    fontStyle = "italic";
    family = family.replace("-Oblique", "").replace("-Italic", "");
  }
  if (family === "Times-Roman") {
    family = "Times, serif";
  } else if (family === "Courier") {
    family = "Courier, monospace";
  } else {
    family = `${family}, sans-serif`;
  }

  return { fontWeight, fontStyle, fontFamily: family };
}

export function getCanvasFontString(font: string, sizePx: number): string {
  const css = getCssFont(font);
  return `${css.fontStyle} ${css.fontWeight} ${sizePx}px ${css.fontFamily}`;
}
