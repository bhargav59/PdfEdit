"use client";

import type { EditorState, EditorTool } from "@/lib/editor-types";

interface EditorToolbarProps {
  toolState: EditorState;
  onToolStateChange: (state: EditorState) => void;
  onUndo: () => void;
  onSave: () => void;
  canUndo: boolean;
  canSave: boolean;
  saving: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const TOOLS: { id: EditorTool; label: string; icon: string }[] = [
  { id: "text", label: "Text", icon: "T" },
  { id: "draw", label: "Draw", icon: "\u270E" },
  { id: "highlight", label: "Highlight", icon: "\u25A8" },
  { id: "whiteout", label: "White-out", icon: "\u25A1" },
];

const FONT_SIZES = [10, 12, 14, 18, 24, 36];
const STROKE_WIDTHS = [1, 2, 4, 6];
const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#FFFF00" },
  { label: "Green", value: "#00FF00" },
  { label: "Pink", value: "#FF69B4" },
  { label: "Blue", value: "#87CEEB" },
];

export default function EditorToolbar({
  toolState,
  onToolStateChange,
  onUndo,
  onSave,
  canUndo,
  canSave,
  saving,
  currentPage,
  totalPages,
  onPageChange,
}: EditorToolbarProps) {
  const update = (partial: Partial<EditorState>) =>
    onToolStateChange({ ...toolState, ...partial });

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 flex-wrap">
      {/* Tool buttons */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => update({ activeTool: tool.id })}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              toolState.activeTool === tool.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title={tool.label}
          >
            <span className="mr-1">{tool.icon}</span>
            {tool.label}
          </button>
        ))}
      </div>

      {/* Tool-specific options */}
      <div className="flex items-center gap-2 border-r border-gray-200 pr-2">
        {toolState.activeTool === "text" && (
          <>
            <select
              value={toolState.fontSize}
              onChange={(e) => update({ fontSize: Number(e.target.value) })}
              className="border border-gray-300 rounded px-1 py-1 text-sm"
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}pt
                </option>
              ))}
            </select>
            <input
              type="color"
              value={toolState.fontColor}
              onChange={(e) => update({ fontColor: e.target.value })}
              className="w-7 h-7 border border-gray-300 rounded cursor-pointer"
              title="Text color"
            />
            <select
              value={toolState.fontFamily}
              onChange={(e) =>
                update({
                  fontFamily: e.target.value as EditorState["fontFamily"],
                })
              }
              className="border border-gray-300 rounded px-1 py-1 text-sm"
            >
              <option value="Helvetica">Helvetica</option>
              <option value="Helvetica-Bold">Helvetica Bold</option>
              <option value="Helvetica-Oblique">Helvetica Oblique</option>
              <option value="Times-Roman">Times</option>
              <option value="Times-Bold">Times Bold</option>
              <option value="Times-Italic">Times Italic</option>
              <option value="Courier">Courier</option>
              <option value="Courier-Bold">Courier Bold</option>
              <option value="Courier-Oblique">Courier Oblique</option>
              <option value="Roboto">Roboto</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="OpenSans">Open Sans</option>
            </select>
          </>
        )}
        {toolState.activeTool === "draw" && (
          <>
            <input
              type="color"
              value={toolState.strokeColor}
              onChange={(e) => update({ strokeColor: e.target.value })}
              className="w-7 h-7 border border-gray-300 rounded cursor-pointer"
              title="Stroke color"
            />
            <select
              value={toolState.strokeWidth}
              onChange={(e) =>
                update({ strokeWidth: Number(e.target.value) })
              }
              className="border border-gray-300 rounded px-1 py-1 text-sm"
            >
              {STROKE_WIDTHS.map((w) => (
                <option key={w} value={w}>
                  {w}px
                </option>
              ))}
            </select>
          </>
        )}
        {toolState.activeTool === "highlight" && (
          <div className="flex items-center gap-1">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => update({ highlightColor: c.value })}
                className={`w-6 h-6 rounded border-2 ${
                  toolState.highlightColor === c.value
                    ? "border-blue-600"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          &larr;
        </button>
        <span className="text-sm text-gray-600 min-w-[80px] text-center">
          Page {currentPage + 1} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          &rarr;
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Undo
        </button>
        <button
          onClick={onSave}
          disabled={!canSave || saving}
          className="px-4 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
