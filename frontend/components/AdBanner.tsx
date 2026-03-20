"use client";

import { useEffect, useState } from "react";

export default function AdBanner({ dataAdSlot }: { dataAdSlot: string }) {
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Only attempt to push the ad if it hasn't been loaded in this container yet
    try {
      if (typeof window !== "undefined") {
        // @ts-ignore
        const adsbygoogle = window.adsbygoogle || [];
        adsbygoogle.push({});
        setAdLoaded(true);
      }
    } catch (e) {
      console.warn("AdSense error:", e);
    }
  }, []);

  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden my-6 min-h-[90px] text-gray-400 text-sm">
      {/* 
        This is the standard AdSense block. 
        Replace client "ca-pub-XXXXXXXXXXXXXXXX" with your actual Google AdSense publisher ID.
      */}
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" 
        data-ad-slot={dataAdSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
      
      {/* Placeholder text in development or when adblocker is on */}
      {!adLoaded && <span>Advertisement (Support our free tool)</span>}
    </div>
  );
}
