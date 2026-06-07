"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackMetaPageView } from "@/lib/meta-pixel";

export function MetaPixel({ pixelId }: { pixelId?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pixelId) {
      return;
    }

    trackMetaPageView();
  }, [pathname, pixelId, searchParams]);

  return null;
}
