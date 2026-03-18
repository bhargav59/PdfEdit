"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DownloadButton from "@/components/DownloadButton";
import { getJobStatus, getDownloadUrl } from "@/lib/api";
import type { JobDetail } from "@/lib/types";

export default function DownloadPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoDownloadTriggered = useRef(false);

  useEffect(() => {
    async function fetchJob() {
      try {
        const jobDetail = await getJobStatus(jobId);
        setJob(jobDetail);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch job details.";
        setError(message);
      }
    }

    fetchJob();
  }, [jobId]);

  useEffect(() => {
    if (job && job.status === "completed" && !autoDownloadTriggered.current) {
      autoDownloadTriggered.current = true;

      const anchor = document.createElement("a");
      anchor.href = getDownloadUrl(jobId);
      anchor.download = "";
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  }, [job, jobId]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="text-5xl mb-6">&#x26A0;&#xFE0F;</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Error</h2>
        <p className="text-gray-500 mb-8">{error}</p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Back to Tools
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
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
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (job.status !== "completed") {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="text-5xl mb-6">&#x23F3;</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Job Not Ready</h2>
        <p className="text-gray-500 mb-8">
          This job is still {job.status}. Please wait for it to complete.
        </p>
        <Link
          href={`/jobs/${jobId}`}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          View Progress
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16 text-center">
      <div className="text-5xl mb-6">&#x2705;</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Download Ready</h1>
      <p className="text-gray-500 mb-8">
        Your file has been processed successfully. The download should start automatically.
      </p>

      <div className="flex flex-col items-center gap-4">
        <DownloadButton jobId={jobId} />

        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          Process another file
        </Link>
      </div>
    </div>
  );
}
export const runtime = 'edge';
