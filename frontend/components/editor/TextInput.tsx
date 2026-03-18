"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { getCssFont } from "@/lib/pdf";

interface TextInputProps {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  scale: number;
  initialValue?: string;
  width?: number;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

export default function TextInput({
  x,
  y,
  fontSize,
  color,
  fontFamily,
  scale,
  initialValue = "",
  width,
  onCommit,
  onCancel,
}: TextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);
  const committedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        // Select all text when editing existing text
        if (initialValue) {
          el.select();
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [initialValue]);

  const doCommit = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    if (value.trim()) {
      onCommit(value.trim());
    } else {
      onCancel();
    }
  }, [value, onCommit, onCancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doCommit();
      } else if (e.key === "Escape") {
        committedRef.current = true;
        onCancel();
      }
    },
    [doCommit, onCancel]
  );

  const scaledFontSize = Math.max(fontSize * scale, 12);
  const cssFont = getCssFont(fontFamily);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={doCommit}
      className="absolute border-2 border-blue-500 bg-white/90 outline-none px-1 rounded shadow-sm"
      style={{
        left: x,
        top: y,
        fontSize: scaledFontSize,
        fontFamily: cssFont.fontFamily,
        fontWeight: cssFont.fontWeight,
        fontStyle: cssFont.fontStyle,
        color,
        minWidth: width ? Math.max(width, 120) : 120,
        lineHeight: 1.2,
        zIndex: 10,
      }}
      placeholder="Type text..."
    />
  );
}
