"use client";

import { hasCookieConsent } from "@/lib/cookie-consent";

export type InternalAnalyticsEvent =
  | { event: "product_view" | "product_reservation"; productId: string }
  | { event: "add_to_cart"; productId: string; quantity: number }
  | { event: "checkout_whatsapp"; items: { productId: string; quantity: number }[] }
  | { event: "general_whatsapp" };

function sendAnalyticsPayload(path: string, payload: unknown) {
  if (typeof window === "undefined" || !hasCookieConsent("analytics")) return;
  const body = JSON.stringify(payload);

  if (typeof navigator.sendBeacon === "function") {
    const sent = navigator.sendBeacon(path, new Blob([body], { type: "application/json" }));
    if (sent) return;
  }

  void fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function trackInternalEvent(payload: InternalAnalyticsEvent) {
  sendAnalyticsPayload("/api/analytics/event", payload);
}

export function trackInternalSearch(term: string, resultCount: number) {
  sendAnalyticsPayload("/api/analytics/search", { term, resultCount });
}
