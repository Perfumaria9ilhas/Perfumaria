"use client";

import { useCookieConsent } from "@/components/consent/cookie-consent-provider";

export function CookieSettingsButton() {
  const { openPreferences } = useCookieConsent();

  return (
    <button type="button" onClick={openPreferences} className="block text-left hover:text-white">
      Definições de cookies
    </button>
  );
}
