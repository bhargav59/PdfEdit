"use client";

import { useCallback, useRef, useState } from "react";

interface FileDropzoneProps {
  multiple: boolean;
  accept: string;
  onFilesSelected: (files: File[]) => void;
}

export default function FileDropzone({ multiple, accept, onFilesSelected }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        const selected = multiple ? droppedFiles : [droppedFiles[0]];
        onFilesSelected(selected);
      }
    },
    [multiple, onFilesSelected]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        onFilesSelected(selectedFiles);
      }
      e.target.value = "";
    },
    [onFilesSelected]
  );

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
        ${
          isDragOver
            ? "border-blue-500 bg-blue-50 text-blue-600"
            : "border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50 text-gray-500"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
      <div className="text-4xl mb-3">{isDragOver ? "\uD83D\uDCE5" : "\uD83D\uDCC4"}</div>
      <p className="text-base font-medium mb-1">
        {isDragOver ? "Drop files here" : "Drag & drop files here"}
      </p>
      <p className="text-sm text-gray-400">or click to browse</p>
    </div>
  );
}
