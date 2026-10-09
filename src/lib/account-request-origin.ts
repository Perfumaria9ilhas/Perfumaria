import { SITE_URL } from "@/lib/seo";

// Railway terminates TLS at its proxy: Request.url may use an internal host.
// Use the known public origins, never an arbitrary forwarded-host header.
export function isAccountRequestOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const source = new URL(origin);
    if (source.origin !== origin || !["http:", "https:"].includes(source.protocol)) return false;
    if (process.env.NODE_ENV === "production") {
      const canonical = new URL(SITE_URL);
      const apex = new URL(SITE_URL); apex.hostname = apex.hostname.replace(/^www\./, "");
      return origin === canonical.origin || origin === apex.origin;
    }
    return origin === new URL(request.url).origin;
  } catch { return false; }
}
