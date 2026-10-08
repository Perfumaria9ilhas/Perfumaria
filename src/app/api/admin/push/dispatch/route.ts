import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { dispatchAdminAlerts } from "@/lib/admin-push";
export async function POST(request: Request) {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Sessão terminada." }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  try { return NextResponse.json(await dispatchAdminAlerts()); }
  catch { return NextResponse.json({ error: "Push não disponível. Verifique a configuração." }, { status: 503 }); }
}
