export const CONSENT_COOKIE_NAME = "nineilhas_cookie_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type CookieConsent = {
  version: number;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export function readCookieConsent(): CookieConsent | null {
  if (typeof document === "undefined") {
    return null;
  }

  const rawValue = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE_NAME}=`))
    ?.slice(CONSENT_COOKIE_NAME.length + 1);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as Partial<CookieConsent>;

    if (
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }

    return parsed as CookieConsent;
  } catch {
    return null;
  }
}

export function writeCookieConsent(preference: Pick<CookieConsent, "analytics" | "marketing">) {
  const consent: CookieConsent = {
    version: CONSENT_VERSION,
    analytics: preference.analytics,
    marketing: preference.marketing,
    updatedAt: new Date().toISOString(),
  };

  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(consent),
  )}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${
    window.location.protocol === "https:" ? "; Secure" : ""
  }`;

  return consent;
}

export function hasCookieConsent(category: "analytics" | "marketing") {
  return readCookieConsent()?.[category] === true;
}

function deleteCookie(name: string) {
  const hostname = window.location.hostname;
  const domainParts = hostname.split(".");
  const rootDomain = domainParts.length > 1 ? `.${domainParts.slice(-2).join(".")}` : hostname;
  const domains = [undefined, hostname, `.${hostname}`, rootDomain];

  for (const domain of new Set(domains)) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${
      domain ? `; Domain=${domain}` : ""
    }`;
  }
}

function deleteCookiesMatching(prefixes: string[]) {
  const cookieNames = document.cookie
    .split(";")
    .map((entry) => entry.trim().split("=")[0])
    .filter(Boolean);

  for (const cookieName of cookieNames) {
    if (prefixes.some((prefix) => cookieName === prefix || cookieName.startsWith(prefix))) {
      deleteCookie(cookieName);
    }
  }
}

export function clearAnalyticsStorage() {
  deleteCookiesMatching(["_ga", "_gid", "_gat"]);
  window.localStorage.removeItem("9ilhas-last-visit-date");
}

export function clearMarketingStorage() {
  deleteCookiesMatching(["_fbp", "_fbc"]);
  window.localStorage.removeItem("nineilhas-meta-utm");
}
