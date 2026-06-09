"use client";

import Script from "next/script";
import { useEffect } from "react";
import { getAzoresDateKey } from "@/lib/date";

const VISIT_KEY = "9ilhas-last-visit-date";
const GA_ID = "G-VQ486TJ198";

export function SiteVisitTracker() {
  useEffect(() => {
    const todayKey = getAzoresDateKey();
    const lastTracked = window.localStorage.getItem(VISIT_KEY);

    if (lastTracked !== todayKey) {
      void fetch("/api/visits/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(() => {
          window.localStorage.setItem(VISIT_KEY, todayKey);
        })
        .catch(() => {
          // Ignorar erros
        });
    }
  }, []);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />

      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];

          function gtag(){
            dataLayer.push(arguments);
          }

          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}