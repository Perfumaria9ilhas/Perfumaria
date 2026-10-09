import webpush from "web-push";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getAdminAlerts } from "@/lib/admin-alerts";
import { isTrustedPushEndpoint } from "@/lib/admin-push-validation";
export function pushConfigured() {
  return Boolean(process.env.ADMIN_VAPID_PUBLIC_KEY && process.env.ADMIN_VAPID_PRIVATE_KEY && process.env.ADMIN_VAPID_SUBJECT);
}
export async function sendAdminPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: { body: string; url: string; tag: string }) {
  if (!pushConfigured() || !isTrustedPushEndpoint(subscription.endpoint)) throw new Error("Push não configurado.");
  return webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(payload), {
    vapidDetails: { subject: process.env.ADMIN_VAPID_SUBJECT!, publicKey: process.env.ADMIN_VAPID_PUBLIC_KEY!, privateKey: process.env.ADMIN_VAPID_PRIVATE_KEY! }, TTL: 3600, urgency: "normal", timeout: 10000,
  });
}
export async function dispatchAdminAlerts() {
  if (!pushConfigured()) return { configured: false, sent: 0 };
  const [subscriptions, alerts] = await Promise.all([prisma.adminPushSubscription.findMany(), getAdminAlerts()]);
  let sent = 0;
  for (const subscription of subscriptions) {
    const active = alerts.filter(alert => (alert.category !== "out" && subscription[alert.category]) && alert.count > 0);
    const fingerprint = active.length ? createHash("sha256").update(active.map(a => `${a.category}:${a.fingerprint}`).join("|")).digest("hex") : null;
    if (fingerprint === subscription.lastAlertFingerprint) continue;
    // Compare-and-swap prevents parallel requests/events sending the same alert.
    const claim = await prisma.adminPushSubscription.updateMany({ where: { id: subscription.id, lastAlertFingerprint: subscription.lastAlertFingerprint }, data: { lastAlertFingerprint: fingerprint } });
    if (!claim.count || !active.length) continue;
    try {
      await sendAdminPush(subscription, { body: "Existem alertas por resolver. Consulte o Admin.", url: active.length === 1 ? active[0].href : "/admin", tag: "admin-alerts" }); sent++;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await prisma.adminPushSubscription.deleteMany({ where: { id: subscription.id } });
      else await prisma.adminPushSubscription.updateMany({ where: { id: subscription.id, lastAlertFingerprint: fingerprint }, data: { lastAlertFingerprint: subscription.lastAlertFingerprint } });
    }
  }
  return { configured: true, sent };
}
// Notification failures must never roll back or block sales/stock operations.
export async function notifyAdminSafely() {
  try { await dispatchAdminAlerts(); } catch { console.error("Admin push dispatch unavailable; business operation was preserved."); }
}
