"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackMetaPageView } from "@/lib/meta-pixel";

export function MetaPixel({ pixelId }: { pixelId?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasTrackedInitialView = useRef(false);

  useEffect(() => {
    if (!pixelId) {
      return;
    }

    if (!hasTrackedInitialView.current) {
      hasTrackedInitialView.current = true;
      return;
    }

    trackMetaPageView();
  }, [pathname, pixelId, searchParams]);

  return null;
}
