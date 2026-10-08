import { z } from "zod";
// Prevent subscriptions being used as an arbitrary server-side HTTP proxy.
export function isTrustedPushEndpoint(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443") &&
      (host === "fcm.googleapis.com" || host === "updates.push.services.mozilla.com" || host.endsWith(".push.apple.com") || host === "web.push.apple.com" || host.endsWith(".notify.windows.com"));
  } catch { return false; }
}
export const pushEndpointSchema = z.string().max(2048).refine(isTrustedPushEndpoint, "Serviço push não permitido.");
export const pushSubscriptionSchema = z.object({
  endpoint: pushEndpointSchema,
  keys: z.object({ p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}={0,2}$/), auth: z.string().regex(/^[A-Za-z0-9_-]{22}={0,2}$/) }).strict(),
}).strict();
export const pushPreferencesSchema = z.object({ payments: z.boolean(), deliveries: z.boolean(), stock: z.boolean() }).strict();
