"use client";

import { useEffect, useRef } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";

export function CompleteRegistrationTracker({
  enabled,
}: {
  enabled: boolean;
}) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasTrackedRef.current) {
      return;
    }

    hasTrackedRef.current = true;
    trackMetaEvent("CompleteRegistration");

    const url = new URL(window.location.href);
    url.searchParams.delete("registered");
    window.history.replaceState({}, "", url.toString());
  }, [enabled]);

  return null;
}
