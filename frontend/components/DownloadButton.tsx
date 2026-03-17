"use client";

import { getDownloadUrl } from "@/lib/api";

interface DownloadButtonProps {
  jobId: string;
}

export default function DownloadButton({ jobId }: DownloadButtonProps) {
  const downloadUrl = getDownloadUrl(jobId);

  return (
    <a
      href={downloadUrl}
      download
      className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
    >
      Download File
    </a>
  );
}
