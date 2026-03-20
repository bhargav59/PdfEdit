"use client";

import { useEffect } from "react";

export default function WakeUp() {
  useEffect(() => {
    // Ping the backend to wake up the Hugging Face Space if it's asleep
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${API_URL}/health`)
      .then(() => {
        console.log("Backend wake up ping successful.");
      })
      .catch((err) => {
        console.warn("Backend wake up ping failed (might be waking up):", err);
      });
  }, []);

  return null;
}
