import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { getAdminAlerts } from "@/lib/admin-alerts";
export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Sessão terminada." }, { status: 401 });
  try {
    const alerts = await getAdminAlerts();
    return NextResponse.json({ alerts: alerts.map(({ category, label, count, href }) => ({ category, label, count, href })), total: alerts.reduce((sum, item) => sum + item.count, 0) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar os alertas. Tente novamente." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
