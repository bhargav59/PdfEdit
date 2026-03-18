// TypeScript types for the PDF editor feature.

export type EditorTool = "text" | "draw" | "highlight" | "whiteout";

// ── Operation types (coordinates in PDF points, origin bottom-left) ─────────

interface BaseOperation {
  type: string;
  page: number; // 0-indexed
}

export interface AddTextOperation extends BaseOperation {
  type: "add_text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily:
    | "Helvetica"
    | "Times-Roman"
    | "Courier"
    | "Helvetica-Bold"
    | "Times-Bold"
    | "Courier-Bold"
    | "Helvetica-Oblique"
    | "Times-Italic"
    | "Courier-Oblique";
}

export interface DrawOperation extends BaseOperation {
  type: "draw";
  points: [number, number][];
  strokeColor: string;
  strokeWidth: number;
}

export interface HighlightOperation extends BaseOperation {
  type: "highlight";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

export interface WhiteoutOperation extends BaseOperation {
  type: "whiteout";
  x: number;
  y: number;
  width: number;
  height: number;
}

export type EditOperation =
  | AddTextOperation
  | DrawOperation
  | HighlightOperation
  | WhiteoutOperation;

// ── Extracted text item from pdf.js ─────────────────────────────────────────

export interface PdfTextItem {
  str: string;
  // Position in canvas pixels (for overlay positioning)
  left: number;
  top: number;
  width: number;
  height: number;
  // Position in PDF points (for generating operations)
  pdfX: number;
  pdfY: number; // baseline Y in PDF coords
  pdfWidth: number;
  pdfHeight: number;
  fontSize: number; // estimated font size in PDF points
}

// ── Editor UI state ─────────────────────────────────────────────────────────

export interface EditorState {
  activeTool: EditorTool;
  fontSize: number;
  fontColor: string;
  fontFamily:
    | "Helvetica"
    | "Times-Roman"
    | "Courier"
    | "Helvetica-Bold"
    | "Times-Bold"
    | "Courier-Bold"
    | "Helvetica-Oblique"
    | "Times-Italic"
    | "Courier-Oblique";
  strokeColor: string;
  strokeWidth: number;
  highlightColor: string;
  highlightOpacity: number;
}

export const DEFAULT_EDITOR_STATE: EditorState = {
  activeTool: "text",
  fontSize: 14,
  fontColor: "#000000",
  fontFamily: "Helvetica",
  strokeColor: "#FF0000",
  strokeWidth: 2,
  highlightColor: "#FFFF00",
  highlightOpacity: 0.35,
};

// ── Reducer actions ─────────────────────────────────────────────────────────

export type OperationsAction =
  | { type: "ADD"; operation: EditOperation }
  | { type: "UNDO" }
  | { type: "CLEAR" };

export function operationsReducer(
  state: EditOperation[],
  action: OperationsAction
): EditOperation[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.operation];
    case "UNDO":
      return state.slice(0, -1);
    case "CLEAR":
      return [];
  }
}
