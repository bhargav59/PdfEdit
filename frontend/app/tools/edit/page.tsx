"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import FileDropzone from "@/components/FileDropzone";
import PdfEditor from "@/components/editor/PdfEditor";
import { uploadFile, createJob } from "@/lib/api";
import type { EditOperation } from "@/lib/editor-types";
import Link from "next/link";

export default function EditPage() {
  const router = useRouter();
  const [fileId, setFileId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setError(null);
    setPdfUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const result = await uploadFile(file);
      setFileId(result.file_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPdfUrl(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSave = useCallback(
    async (operations: EditOperation[]) => {
      if (!fileId) return;
      setSaving(true);
      setError(null);

      try {
        const job = await createJob("edit", [fileId], { operations });
        router.push(`/jobs/${job.job_id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
        setSaving(false);
      }
    },
    [fileId, router]
  );

  // Phase 1: Upload
  if (!pdfUrl) {
    return (
      <div className="py-12">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
          >
            &larr; Back to tools
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit PDF</h1>
          <p className="text-gray-500 mb-8">
            Add text, draw, highlight, and white-out content directly on your
            PDF.
          </p>

          <FileDropzone
            multiple={false}
            accept=".pdf,application/pdf"
            onFilesSelected={handleFileSelected}
          />

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Phase 2: Editor
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {uploading && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          Uploading file to server...
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      <PdfEditor
        pdfUrl={pdfUrl}
        onSave={handleSave}
        saving={saving}
        uploadReady={!!fileId && !uploading}
      />
    </div>
  );
}
