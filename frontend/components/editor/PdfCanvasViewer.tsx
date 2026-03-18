"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { PDFDocumentProxy } from "@/lib/pdf";
import { canvasToPdfCoords, pdfToCanvasCoords, getCanvasFontString } from "@/lib/pdf";
import type {
  EditorState,
  EditOperation,
  DrawOperation,
  PdfTextItem,
} from "@/lib/editor-types";
import TextInput from "./TextInput";

interface ActiveTextEdit {
  x: number;
  y: number;
  width: number;
  initialValue: string;
  original: PdfTextItem | null; // null means adding new text
}

interface PdfCanvasViewerProps {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  scale: number;
  toolState: EditorState;
  operations: EditOperation[];
  onAddOperation: (op: EditOperation) => void;
}

export default function PdfCanvasViewer({
  pdfDoc,
  currentPage,
  scale,
  toolState,
  operations,
  onAddOperation,
}: PdfCanvasViewerProps) {
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageHeightPtsRef = useRef(0);
  const pageWidthPtsRef = useRef(0);

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const isDrawingRef = useRef(false);
  const drawPointsRef = useRef<[number, number][]>([]);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const [, forceRender] = useState(0);
  const [textEdit, setTextEdit] = useState<ActiveTextEdit | null>(null);
  const [textItems, setTextItems] = useState<PdfTextItem[]>([]);

  // Render the PDF page onto the base canvas and extract text items
  useEffect(() => {
    if (!pdfDoc || !baseCanvasRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const page = await pdfDoc.getPage(currentPage + 1);
        if (cancelled || !baseCanvasRef.current) return;

        const viewport = page.getViewport({ scale });
        const unscaledViewport = page.getViewport({ scale: 1 });
        pageHeightPtsRef.current = unscaledViewport.height;
        pageWidthPtsRef.current = unscaledViewport.width;

        const dpr = window.devicePixelRatio || 1;
        const canvas = baseCanvasRef.current;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const ctx = canvas.getContext("2d")!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Extract text content for editing
        const textContent = await page.getTextContent();
        const pageH = unscaledViewport.height;
        const items: PdfTextItem[] = [];

        for (const item of textContent.items) {
          if (!("str" in item) || !item.str.trim()) continue;
          const t = item.transform; // [scaleX, skewX, skewY, scaleY, tx, ty]
          const pdfX = t[4];
          const pdfY = t[5];
          const estFontSize = Math.abs(t[3]) || 12;
          const pdfWidth = item.width || (item.str.length * estFontSize * 0.6);

          // Font metrics: ascent ~85% above baseline, descent ~25% below
          const ascent = estFontSize * 0.85;
          const descent = estFontSize * 0.25;

          // Convert to canvas coordinates (top-left of the text bounding box)
          const canvasX = pdfX * scale;
          const canvasTopY = (pageH - pdfY) * scale - ascent * scale;
          const canvasW = pdfWidth * scale;
          const canvasH = (ascent + descent) * scale;

          items.push({
            str: item.str,
            left: canvasX,
            top: canvasTopY,
            width: canvasW,
            height: canvasH,
            pdfX,
            pdfY,
            pdfWidth,
            pdfHeight: estFontSize,
            fontSize: estFontSize,
          });
        }

        if (!cancelled) {
          setTextItems(items);
          setCanvasSize({
            width: Math.ceil(viewport.width),
            height: Math.ceil(viewport.height),
          });
        }
      } catch (err) {
        console.error("PDF render failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage, scale]);

  // Size overlay canvas to match base canvas
  useEffect(() => {
    if (!overlayCanvasRef.current || canvasSize.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const canvas = overlayCanvasRef.current;
    canvas.width = Math.floor(canvasSize.width * dpr);
    canvas.height = Math.floor(canvasSize.height * dpr);
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
  }, [canvasSize]);

  // Render overlay — called on every relevant change
  const renderOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || canvasSize.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const pageH = pageHeightPtsRef.current;

    // Render committed operations
    for (const op of operations) {
      switch (op.type) {
        case "add_text": {
          const pos = pdfToCanvasCoords(op.x, op.y, scale, pageH);
          ctx.font = getCanvasFontString(op.fontFamily, op.fontSize * scale);
          ctx.fillStyle = op.color;
          ctx.textBaseline = "alphabetic";
          ctx.fillText(op.text, pos.x, pos.y);
          break;
        }
        case "draw": {
          if (op.points.length < 2) break;
          ctx.strokeStyle = op.strokeColor;
          ctx.lineWidth = op.strokeWidth * scale;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          const [sx, sy] = op.points[0];
          const s = pdfToCanvasCoords(sx, sy, scale, pageH);
          ctx.moveTo(s.x, s.y);
          for (let i = 1; i < op.points.length; i++) {
            const [px, py] = op.points[i];
            const p = pdfToCanvasCoords(px, py, scale, pageH);
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          break;
        }
        case "highlight": {
          const hl = pdfToCanvasCoords(op.x, op.y + op.height, scale, pageH);
          ctx.save();
          ctx.globalAlpha = op.opacity;
          ctx.fillStyle = op.color;
          ctx.fillRect(hl.x, hl.y, op.width * scale, op.height * scale);
          ctx.restore();
          break;
        }
        case "whiteout": {
          const wo = pdfToCanvasCoords(op.x, op.y + op.height, scale, pageH);
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(wo.x, wo.y, op.width * scale, op.height * scale);
          break;
        }
      }
    }

    // Draw in-progress freehand stroke
    const pts = drawPointsRef.current;
    if (isDrawingRef.current && pts.length >= 2) {
      ctx.strokeStyle = toolState.strokeColor;
      ctx.lineWidth = toolState.strokeWidth * scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const [fx, fy] = pts[0];
      const f = pdfToCanvasCoords(fx, fy, scale, pageH);
      ctx.moveTo(f.x, f.y);
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = pts[i];
        const p = pdfToCanvasCoords(px, py, scale, pageH);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Draw in-progress drag rectangle (highlight / whiteout preview)
    const ds = dragStartRef.current;
    const de = dragEndRef.current;
    if (ds && de) {
      const left = Math.min(ds.x, de.x);
      const top = Math.min(ds.y, de.y);
      const w = Math.abs(de.x - ds.x);
      const h = Math.abs(de.y - ds.y);

      if (toolState.activeTool === "highlight") {
        ctx.save();
        ctx.globalAlpha = toolState.highlightOpacity;
        ctx.fillStyle = toolState.highlightColor;
        ctx.fillRect(left, top, w, h);
        ctx.restore();
      } else if (toolState.activeTool === "whiteout") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(left, top, w, h);
        ctx.strokeStyle = "#CCCCCC";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(left, top, w, h);
        ctx.setLineDash([]);
      }
    }
  }, [operations, canvasSize, scale, toolState]);

  // Re-render overlay when operations or canvas changes
  useEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

  // Get mouse position relative to overlay canvas
  const getCanvasPos = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const rect = overlayCanvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    []
  );

  // Find text item at a given canvas position
  const findTextItemAtPos = useCallback(
    (cx: number, cy: number): PdfTextItem | null => {
      // Search in reverse so topmost items win
      for (let i = textItems.length - 1; i >= 0; i--) {
        const item = textItems[i];
        if (
          cx >= item.left - 2 &&
          cx <= item.left + item.width + 2 &&
          cy >= item.top - 2 &&
          cy <= item.top + item.height + 2
        ) {
          return item;
        }
      }
      return null;
    },
    [textItems]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Ignore if text input is active
      if (textEdit) return;

      const pos = getCanvasPos(e);

      if (toolState.activeTool === "text") {
        // Check if clicking on existing text
        const hit = findTextItemAtPos(pos.x, pos.y);
        if (hit) {
          setTextEdit({
            x: hit.left,
            y: hit.top,
            width: hit.width,
            initialValue: hit.str,
            original: hit,
          });
        } else {
          setTextEdit({
            x: pos.x,
            y: pos.y,
            width: 0,
            initialValue: "",
            original: null,
          });
        }
        return;
      }

      if (toolState.activeTool === "draw") {
        const pdfPt = canvasToPdfCoords(
          pos.x,
          pos.y,
          scale,
          pageHeightPtsRef.current
        );
        isDrawingRef.current = true;
        drawPointsRef.current = [[pdfPt.x, pdfPt.y]];
        return;
      }

      if (
        toolState.activeTool === "highlight" ||
        toolState.activeTool === "whiteout"
      ) {
        dragStartRef.current = pos;
        dragEndRef.current = pos;
      }
    },
    [toolState.activeTool, scale, getCanvasPos, textEdit, findTextItemAtPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDrawingRef.current && toolState.activeTool === "draw") {
        const pos = getCanvasPos(e);
        const pdfPt = canvasToPdfCoords(
          pos.x,
          pos.y,
          scale,
          pageHeightPtsRef.current
        );
        const pts = drawPointsRef.current;
        const last = pts[pts.length - 1];
        const dx = pdfPt.x - last[0];
        const dy = pdfPt.y - last[1];
        if (dx * dx + dy * dy < 4) return;
        drawPointsRef.current = [...pts, [pdfPt.x, pdfPt.y]];
        renderOverlay();
        return;
      }

      if (dragStartRef.current) {
        const pos = getCanvasPos(e);
        dragEndRef.current = pos;
        renderOverlay();
      }
    },
    [toolState.activeTool, scale, getCanvasPos, renderOverlay]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawingRef.current && drawPointsRef.current.length >= 2) {
      const op: DrawOperation = {
        type: "draw",
        page: currentPage,
        points: [...drawPointsRef.current],
        strokeColor: toolState.strokeColor,
        strokeWidth: toolState.strokeWidth,
      };
      isDrawingRef.current = false;
      drawPointsRef.current = [];
      onAddOperation(op);
      return;
    }
    isDrawingRef.current = false;
    drawPointsRef.current = [];

    const ds = dragStartRef.current;
    const de = dragEndRef.current;
    if (ds && de) {
      const pageH = pageHeightPtsRef.current;
      const cLeft = Math.min(ds.x, de.x);
      const cTop = Math.min(ds.y, de.y);
      const cRight = Math.max(ds.x, de.x);
      const cBottom = Math.max(ds.y, de.y);

      dragStartRef.current = null;
      dragEndRef.current = null;

      if (cRight - cLeft < 5 || cBottom - cTop < 5) {
        forceRender((n) => n + 1);
        return;
      }

      const pdfLeft = cLeft / scale;
      const pdfRight = cRight / scale;
      const pdfTop = pageH - cTop / scale;
      const pdfBottom = pageH - cBottom / scale;

      if (toolState.activeTool === "highlight") {
        onAddOperation({
          type: "highlight",
          page: currentPage,
          x: pdfLeft,
          y: pdfBottom,
          width: pdfRight - pdfLeft,
          height: pdfTop - pdfBottom,
          color: toolState.highlightColor,
          opacity: toolState.highlightOpacity,
        });
      } else if (toolState.activeTool === "whiteout") {
        onAddOperation({
          type: "whiteout",
          page: currentPage,
          x: pdfLeft,
          y: pdfBottom,
          width: pdfRight - pdfLeft,
          height: pdfTop - pdfBottom,
        });
      }
    }
  }, [currentPage, toolState, scale, onAddOperation]);

  const handleTextCommit = useCallback(
    (text: string) => {
      if (!textEdit) return;

      if (textEdit.original) {
        // Editing existing text: whiteout the original, then add new text
        const orig = textEdit.original;
        // Generous padding + proper font metrics to fully cover original text
        const padding = 5;
        const ascent = orig.fontSize * 0.85;
        const descent = orig.fontSize * 0.25;
        onAddOperation({
          type: "whiteout",
          page: currentPage,
          x: orig.pdfX - padding,
          y: orig.pdfY - descent - padding,
          width: orig.pdfWidth + padding * 2,
          height: ascent + descent + padding * 2,
        });
        onAddOperation({
          type: "add_text",
          page: currentPage,
          x: orig.pdfX,
          y: orig.pdfY,
          text,
          fontSize: orig.fontSize,
          color: toolState.fontColor,
          fontFamily: toolState.fontFamily,
        });
      } else {
        // Adding new text: adjust for baseline. textEdit.y is the top of the box.
        // Assuming ~85% of font size is ascent
        const ascentPx = toolState.fontSize * scale * 0.85;
        const pdfPt = canvasToPdfCoords(
          textEdit.x,
          textEdit.y + ascentPx,
          scale,
          pageHeightPtsRef.current
        );
        onAddOperation({
          type: "add_text",
          page: currentPage,
          x: pdfPt.x,
          y: pdfPt.y,
          text,
          fontSize: toolState.fontSize,
          color: toolState.fontColor,
          fontFamily: toolState.fontFamily,
        });
      }
      setTextEdit(null);
    },
    [textEdit, scale, currentPage, toolState, onAddOperation]
  );

  // Handle clicking on an existing text overlay div
  const handleTextItemClick = useCallback(
    (item: PdfTextItem) => {
      if (textEdit) return;
      setTextEdit({
        x: item.left,
        y: item.top,
        width: item.width,
        initialValue: item.str,
        original: item,
      });
    },
    [textEdit]
  );

  const cursorStyle =
    toolState.activeTool === "text" ? "text" : "crosshair";

  const isLoading = canvasSize.width === 0;

  return (
    <div className="flex-1 overflow-auto bg-gray-100 flex justify-center p-4">
      {/* Loading overlay — shown while canvas dimensions are unknown */}
      {isLoading && (
        <div className="flex items-center justify-center absolute inset-0 z-10">
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-400">Rendering page...</p>
          </div>
        </div>
      )}

      {/* Canvases are ALWAYS mounted so refs are available to the render effect */}
      <div
        ref={containerRef}
        className="relative inline-block shadow-lg bg-white"
        style={{
          width: canvasSize.width || "auto",
          height: canvasSize.height || "auto",
          cursor: isLoading ? "default" : cursorStyle,
          minWidth: isLoading ? 0 : undefined,
          minHeight: isLoading ? 0 : undefined,
        }}
      >
        <canvas ref={baseCanvasRef} className="absolute top-0 left-0" />
        <canvas
          ref={overlayCanvasRef}
          className="absolute top-0 left-0"
          style={{ cursor: isLoading ? "default" : cursorStyle }}
          onMouseDown={isLoading ? undefined : handleMouseDown}
          onMouseMove={isLoading ? undefined : handleMouseMove}
          onMouseUp={isLoading ? undefined : handleMouseUp}
          onMouseLeave={isLoading ? undefined : handleMouseUp}
        />

        {/* Existing text overlays — shown only when text tool is active */}
        {!isLoading &&
          toolState.activeTool === "text" &&
          !textEdit &&
          textItems.map((item, idx) => (
            <div
              key={idx}
              className="absolute border border-transparent hover:border-blue-400 hover:bg-blue-100/30 transition-colors"
              style={{
                left: item.left,
                top: item.top,
                width: item.width,
                height: item.height,
                cursor: "text",
                zIndex: 5,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleTextItemClick(item);
              }}
              title={`Click to edit: "${item.str}"`}
            />
          ))}

        {textEdit && (
          <TextInput
            x={textEdit.x}
            y={textEdit.y}
            fontSize={textEdit.original ? textEdit.original.fontSize : toolState.fontSize}
            color={toolState.fontColor}
            fontFamily={toolState.fontFamily}
            scale={scale}
            initialValue={textEdit.initialValue}
            width={textEdit.width}
            onCommit={handleTextCommit}
            onCancel={() => setTextEdit(null)}
          />
        )}
      </div>
    </div>
  );
}
