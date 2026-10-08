import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pushConfigured, sendAdminPush } from "@/lib/admin-push";
import { pushEndpointSchema, pushPreferencesSchema, pushSubscriptionSchema } from "@/lib/admin-push-validation";
import { z } from "zod";
const message = "Notificações push precisam das chaves VAPID e da migração de subscrições no servidor.";
async function access(request: Request, mutation = false) {
  const admin = await getCurrentAdmin();
  if (!admin) return { response: NextResponse.json({ error: "Sessão terminada." }, { status: 401 }) };
  if (mutation && request.headers.get("origin") !== new URL(request.url).origin) return { response: NextResponse.json({ error: "Origem inválida." }, { status: 403 }) };
  return { admin };
}
export async function GET(request: Request) {
  const result = await access(request); if (result.response) return result.response;
  if (!pushConfigured()) return NextResponse.json({ configured: false, message });
  const endpoint = pushEndpointSchema.safeParse(new URL(request.url).searchParams.get("endpoint"));
  try {
    await prisma.adminPushSubscription.count({ where: { adminId: result.admin!.id! } });
    const sub = endpoint.success ? await prisma.adminPushSubscription.findFirst({ where: { adminId: result.admin!.id!, endpoint: endpoint.data }, select: { payments: true, deliveries: true, stock: true } }) : null;
    return NextResponse.json({ configured: true, publicKey: process.env.ADMIN_VAPID_PUBLIC_KEY, subscribed: !!sub, preferences: sub });
  } catch { return NextResponse.json({ configured: false, message }); }
}
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("subscribe"), subscription: pushSubscriptionSchema, preferences: pushPreferencesSchema }).strict(),
  z.object({ action: z.literal("preferences"), endpoint: pushEndpointSchema, preferences: pushPreferencesSchema }).strict(),
  z.object({ action: z.literal("unsubscribe"), endpoint: pushEndpointSchema }).strict(),
  z.object({ action: z.literal("test"), endpoint: pushEndpointSchema }).strict(),
]);
export async function POST(request: Request) {
  const result = await access(request, true); if (result.response) return result.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Subscrição ou preferências inválidas." }, { status: 400 });
  const data = parsed.data;
  if (data.action !== "unsubscribe" && !pushConfigured()) return NextResponse.json({ error: message }, { status: 503 });
  const endpoint = data.action === "subscribe" ? data.subscription.endpoint : data.endpoint;
  try {
    const existing = await prisma.adminPushSubscription.findUnique({ where: { endpoint } });
    if (existing && existing.adminId !== result.admin!.id) return NextResponse.json({ error: "Subscrição indisponível para este administrador." }, { status: 403 });
    if (data.action === "subscribe") {
      await prisma.adminPushSubscription.upsert({ where: { endpoint }, create: { endpoint, adminId: result.admin!.id!, ...data.subscription.keys, ...data.preferences }, update: { ...data.subscription.keys, ...data.preferences, lastAlertFingerprint: null } });
    } else if (data.action === "unsubscribe") {
      await prisma.adminPushSubscription.deleteMany({ where: { endpoint, adminId: result.admin!.id! } });
    } else {
      if (!existing) return NextResponse.json({ error: "Ative primeiro as notificações neste dispositivo." }, { status: 404 });
      if (data.action === "preferences") await prisma.adminPushSubscription.update({ where: { id: existing.id }, data: { ...data.preferences, lastAlertFingerprint: null } });
      else {
        const now = new Date();
        const claim = await prisma.adminPushSubscription.updateMany({ where: { id: existing.id, OR: [{ lastTestAt: null }, { lastTestAt: { lt: new Date(now.getTime() - 60000) } }] }, data: { lastTestAt: now } });
        if (!claim.count) return NextResponse.json({ error: "Aguarde um minuto antes de outro teste." }, { status: 429 });
        await sendAdminPush(existing, { body: "As notificações do Admin estão ativas neste dispositivo.", url: "/admin", tag: "admin-test" });
      }
    }
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Não foi possível guardar ou enviar. Verifique a configuração de push no servidor." }, { status: 503 }); }
}
