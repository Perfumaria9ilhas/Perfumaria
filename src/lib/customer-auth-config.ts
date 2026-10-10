import { SITE_URL } from "@/lib/seo";
export function customerAuthOrigin() {
  const origin = new URL(process.env.CUSTOMER_AUTH_ORIGIN || SITE_URL).origin;
  if (process.env.NODE_ENV === "production" && !origin.startsWith("https://")) throw new Error("Recovery requires HTTPS");
  return origin;
}
export function recoveryAvailability() { return { recovery: !!(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM) }; }
