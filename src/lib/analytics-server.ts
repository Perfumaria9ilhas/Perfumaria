import { createHash } from "node:crypto";
import { CONSENT_COOKIE_NAME, CONSENT_VERSION } from "@/lib/cookie-consent";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;

export function hasServerAnalyticsConsent(request: Request) {
  const rawCookie = request.headers.get("cookie") ?? "";
  const match = rawCookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!match) return false;

  try {
    const value = match.slice(CONSENT_COOKIE_NAME.length + 1);
    const consent = JSON.parse(decodeURIComponent(value)) as {
      version?: number;
      analytics?: boolean;
    };
    return consent.version === CONSENT_VERSION && consent.analytics === true;
  } catch {
    return false;
  }
}

export function isAnalyticsRateLimited(request: Request) {
  const source =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const key = createHash("sha256")
    .update(`${process.env.ADMIN_SESSION_SECRET ?? "analytics"}:${source}`)
    .digest("hex")
    .slice(0, 24);
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  if (rateBuckets.size > 5_000) {
    for (const [bucketKey, entry] of rateBuckets) {
      if (entry.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }
  return bucket.count > RATE_LIMIT;
}

export function normalizeAnalyticsSearchTerm(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-PT")
    .trim()
    .replace(/\s+/g, " ");
}

export function containsLikelyPersonalData(value: string) {
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(?:\+?\d[\s().-]*){7,}/;
  return email.test(value) || phone.test(value);
}
