"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-5xl mb-6">&#x26A0;&#xFE0F;</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h2>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        Try Again
      </button>
    </div>
  );
}
