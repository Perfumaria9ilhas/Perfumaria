"use client";

import { useEffect } from "react";
import { getAzoresDateKey } from "@/lib/date";

const VISIT_KEY = "9ilhas-last-visit-date";

export function SiteVisitTracker() {
  useEffect(() => {
    const todayKey = getAzoresDateKey();
    const lastTracked = window.localStorage.getItem(VISIT_KEY);

    if (lastTracked === todayKey) {
      return;
    }

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
        // Ignore analytics failures so they never affect the storefront.
      });
  }, []);

  return null;
}
