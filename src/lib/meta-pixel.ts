"use client";

import { slugify } from "@/lib/utils";

type MetaPixelValue = string | number | boolean | null | undefined;
type MetaPixelParams = Record<string, MetaPixelValue | MetaPixelValue[]>;
type MetaUtmParams = Partial<Record<"utm_source" | "utm_medium" | "utm_campaign", string>>;

type MetaProductPayloadInput = {
  name: string;
  brand: string;
  value: number;
  category?: string;
  contentType?: string;
  currency?: string;
  quantity?: number;
};

type AllowedMetaEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Contact"
  | "CompleteRegistration";

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

const META_UTM_STORAGE_KEY = "nineilhas-meta-utm";

function readStoredMetaUtmParams(): MetaUtmParams {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedValue = window.localStorage.getItem(META_UTM_STORAGE_KEY);

    if (!storedValue) {
      return {};
    }

    return JSON.parse(storedValue) as MetaUtmParams;
  } catch {
    return {};
  }
}

function readCurrentMetaUtmParams(): MetaUtmParams {
  if (typeof window === "undefined") {
    return {};
  }

  const searchParams = new URLSearchParams(window.location.search);

  const utm_source = searchParams.get("utm_source")?.trim();
  const utm_medium = searchParams.get("utm_medium")?.trim();
  const utm_campaign = searchParams.get("utm_campaign")?.trim();

  return {
    ...(utm_source ? { utm_source } : {}),
    ...(utm_medium ? { utm_medium } : {}),
    ...(utm_campaign ? { utm_campaign } : {}),
  };
}

function getPersistedMetaUtmParams(): MetaUtmParams {
  const currentParams = readCurrentMetaUtmParams();

  if (Object.keys(currentParams).length > 0) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        META_UTM_STORAGE_KEY,
        JSON.stringify(currentParams)
      );
    }

    return currentParams;
  }

  return readStoredMetaUtmParams();
}

function withMetaContext(params?: MetaPixelParams) {
  const utmParams = getPersistedMetaUtmParams();

  if (!params && Object.keys(utmParams).length === 0) {
    return undefined;
  }

  return {
    ...utmParams,
    ...params,
  } satisfies MetaPixelParams;
}

export function buildMetaContentId(name: string, brand: string) {
  return `${slugify(name)}-${slugify(brand)}`;
}

export function buildMetaProductPayload({
  name,
  brand,
  value,
  category,
  contentType = "product",
  currency = "EUR",
  quantity,
}: MetaProductPayloadInput): MetaPixelParams {
  const contentId = buildMetaContentId(name, brand);

  return {
    content_id: contentId,
    content_ids: [contentId],
    content_name: name,
    content_type: contentType,
    value,
    currency,
    ...(category ? { content_category: category } : {}),
    ...(typeof quantity === "number" ? { quantity } : {}),
  };
}

export function trackMetaPageView() {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  const params = withMetaContext();

  if (params) {
    window.fbq("track", "PageView", params);
    return;
  }

  window.fbq("track", "PageView");
}

export function trackMetaEvent(
  eventName: AllowedMetaEvent,
  params?: MetaPixelParams
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  const enrichedParams = withMetaContext(params);

  if (enrichedParams) {
    window.fbq("track", eventName, enrichedParams);
    return;
  }

  window.fbq("track", eventName);
}