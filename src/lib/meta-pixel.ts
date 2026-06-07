"use client";

type MetaPixelValue = string | number | boolean | null | undefined;
type MetaPixelParams = Record<string, MetaPixelValue | MetaPixelValue[]>;

type MetaPixelFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
  }
}

export function trackMetaPageView() {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  window.fbq("track", "PageView");
}

export function trackMetaEvent(eventName: string, params?: MetaPixelParams) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  if (params) {
    window.fbq("track", eventName, params);
    return;
  }

  window.fbq("track", eventName);
}
