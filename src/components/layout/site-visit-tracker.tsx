"use client";

import { useEffect } from "react";
import { getAzoresDateKey } from "@/lib/date";

const VISIT_KEY = "9ilhas-last-visit-date";

export function SiteVisitTracker({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

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
  }, [enabled]);

  return null;
}
