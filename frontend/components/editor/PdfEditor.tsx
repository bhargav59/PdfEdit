"use client";

import { useReducer, useState, useEffect, useCallback } from "react";
import { loadPdfDocument } from "@/lib/pdf";
import type { PDFDocumentProxy } from "@/lib/pdf";
import type { EditOperation, EditorState } from "@/lib/editor-types";
import {
  DEFAULT_EDITOR_STATE,
  operationsReducer,
} from "@/lib/editor-types";
import EditorToolbar from "./EditorToolbar";
import PdfCanvasViewer from "./PdfCanvasViewer";

interface PdfEditorProps {
  pdfUrl: string;
  onSave: (operations: EditOperation[]) => void;
  saving: boolean;
  uploadReady: boolean;
}

export default function PdfEditor({
  pdfUrl,
  onSave,
  saving,
  uploadReady,
}: PdfEditorProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const scale = 1.5;
  const [operations, dispatch] = useReducer(operationsReducer, []);
  const [toolState, setToolState] = useState<EditorState>(DEFAULT_EDITOR_STATE);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    loadPdfDocument(pdfUrl)
      .then((doc) => {
        if (!cancelled) {
          setPdfDoc(doc);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message || "Failed to load PDF");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  const handleAddOperation = useCallback(
    (op: EditOperation) => dispatch({ type: "ADD", operation: op }),
    []
  );

  const pageOperations = operations.filter((op) => op.page === currentPage);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">&#x26A0;</div>
          <p className="text-red-600 font-medium">Failed to load PDF</p>
          <p className="text-sm text-gray-500 mt-1">{loadError}</p>
        </div>
      </div>
    );
  }

  if (loading || !pdfDoc) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-500">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <EditorToolbar
        toolState={toolState}
        onToolStateChange={setToolState}
        onUndo={() => dispatch({ type: "UNDO" })}
        onSave={() => onSave(operations)}
        canUndo={operations.length > 0}
        canSave={uploadReady && operations.length > 0 && !saving}
        saving={saving}
        currentPage={currentPage}
        totalPages={pdfDoc.numPages}
        onPageChange={setCurrentPage}
      />
      <PdfCanvasViewer
        pdfDoc={pdfDoc}
        currentPage={currentPage}
        scale={scale}
        toolState={toolState}
        operations={pageOperations}
        onAddOperation={handleAddOperation}
      />
    </div>
  );
}
