"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import FileDropzone from "@/components/FileDropzone";
import { uploadFile, createJob } from "@/lib/api";
import type { Tool } from "@/lib/types";

const VALID_TOOLS: Tool[] = ["merge", "split", "compress", "convert"];

const TOOL_META: Record<Tool, { title: string; description: string }> = {
  merge: {
    title: "Merge PDF",
    description: "Select multiple PDF files to combine into one document.",
  },
  split: {
    title: "Split PDF",
    description: "Select a PDF file to split into separate pages.",
  },
  compress: {
    title: "Compress PDF",
    description: "Select a PDF file to reduce its file size.",
  },
  convert: {
    title: "Convert PDF",
    description: "Select a PDF file to convert to another format.",
  },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ToolPage() {
  const params = useParams();
  const router = useRouter();
  const tool = params.tool as string;

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidTool = VALID_TOOLS.includes(tool as Tool);

  const handleFilesSelected = useCallback(
    (newFiles: File[]) => {
      if (tool === "merge") {
        setFiles((prev) => [...prev, ...newFiles]);
      } else {
        setFiles(newFiles.slice(0, 1));
      }
      setError(null);
    },
    [tool]
  );

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleProcess = useCallback(async () => {
    if (files.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const uploadResults = await Promise.all(
        files.map((file) => uploadFile(file))
      );

      const fileIds = uploadResults.map((result) => result.file_id);

      const jobResponse = await createJob(tool as Tool, fileIds);

      router.push(`/jobs/${jobResponse.job_id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred during processing.";
      setError(message);
      setIsProcessing(false);
    }
  }, [files, tool, router]);

  if (!isValidTool) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-5xl mb-6">&#x1F50D;</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Tool Not Found</h2>
        <p className="text-gray-500 mb-8">
          The tool &quot;{tool}&quot; does not exist.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const meta = TOOL_META[tool as Tool];
  const isMultiple = tool === "merge";

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors mb-6"
      >
        &larr; Back to Tools
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{meta.title}</h1>
      <p className="text-gray-500 mb-8">{meta.description}</p>

      <FileDropzone
        multiple={isMultiple}
        accept=".pdf,application/pdf"
        onFilesSelected={handleFilesSelected}
      />

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Selected Files ({files.length})
          </h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg flex-shrink-0">&#x1F4C4;</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-3 flex-shrink-0"
                  aria-label={`Remove ${file.name}`}
                >
                  &#x2715;
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleProcess}
        disabled={files.length === 0 || isProcessing}
        className="mt-8 w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
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
            Processing...
          </span>
        ) : (
          "Process"
        )}
      </button>
    </div>
  );
}
