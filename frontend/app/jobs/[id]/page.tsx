"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import { getJobStatus } from "@/lib/api";
import type { JobDetail } from "@/lib/types";

const TOOL_LABELS: Record<string, string> = {
  merge: "Merge PDF",
  split: "Split PDF",
  compress: "Compress PDF",
  convert: "Convert PDF",
};

export default function JobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function pollJobStatus() {
      try {
        const jobDetail = await getJobStatus(jobId);

        if (!isMounted) return;

        setJob(jobDetail);

        if (jobDetail.status === "completed") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          router.push(`/download/${jobId}`);
        } else if (jobDetail.status === "failed") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Failed to fetch job status.";
        setError(message);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }

    pollJobStatus();

    intervalRef.current = setInterval(pollJobStatus, 2000);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId, router]);

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
        <p className="text-gray-500">Loading job status...</p>
      </div>
    );
  }

  if (job.status === "failed") {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="text-5xl mb-6">&#x274C;</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Processing Failed</h2>
        <p className="text-gray-500 mb-8">
          {job.error || "An unexpected error occurred during processing."}
        </p>
        <Link
          href={`/tools/${job.tool}`}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Try Again
        </Link>
      </div>
    );
  }

  const toolLabel = TOOL_LABELS[job.tool] || job.tool;

  return (
    <div className="max-w-xl mx-auto py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{toolLabel}</h1>
        <p className="text-gray-500">
          {job.status === "queued" && "Your job is in the queue. Processing will start shortly..."}
          {job.status === "processing" && "Processing your files. This may take a moment..."}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <ProgressBar progress={job.progress} />

        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <span>
            Status:{" "}
            <span className="font-medium text-gray-700 capitalize">{job.status}</span>
          </span>
          <span>Job ID: {job.job_id.slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
}
