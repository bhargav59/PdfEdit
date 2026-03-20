"use client";

import { useEffect, useState } from "react";
import AdBanner from "./AdBanner";

export default function WakeUp() {
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    let pollInterval: ReturnType<typeof setInterval>;

    const checkHealth = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${API_URL}/health`);
        
        if (response.ok) {
          if (mounted) {
            setIsWakingUp(false);
            setIsChecking(false);
          }
          if (pollInterval) clearInterval(pollInterval);
        } else {
          if (mounted) {
            setIsWakingUp(true);
            setIsChecking(false);
          }
        }
      } catch (err) {
        if (mounted) {
          setIsWakingUp(true);
          setIsChecking(false);
        }
      }
    };

    // Initial check
    checkHealth();

    // Set up polling
    pollInterval = setInterval(checkHealth, 5000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  if (isChecking || !isWakingUp) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50/95 backdrop-blur-sm p-4">
      <div className="max-w-xl w-full text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <svg
          className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Waking up the server...</h2>
        <p className="text-lg text-gray-600 mb-8">
          To keep this tool 100% free, our processing servers occasionally go to sleep. 
          It takes about 1-2 minutes to boot back up. Please wait! The page will refresh automatically.
        </p>

        {/* Ad slot during wait time */}
        <AdBanner dataAdSlot="5678901234" />
      </div>
    </div>
  );
}
