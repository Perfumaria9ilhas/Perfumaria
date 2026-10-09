import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { changeAccount, listAccounts } from "@/lib/account-management";
import { prisma } from "@/lib/prisma";
import { isAccountRequestOriginAllowed } from "@/lib/account-request-origin";

const headers = { "Cache-Control": "private, no-store" };
const schema = z.object({ id: z.string().min(1), kind: z.enum(["CUSTOMER", "ADMIN"]), action: z.enum(["PROMOTE", "DEMOTE", "DISABLE", "ENABLE", "DELETE", "DISMISS_REQUEST"]), version: z.string().datetime(), confirmation: z.string().optional() }).strict();
export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "SUPERADMIN") return NextResponse.json({ error: "Sem permissão." }, { status: admin ? 403 : 401, headers });
  const url = new URL(request.url); const id = url.searchParams.get("audit");
  if (id) return NextResponse.json({ audit: await prisma.accountAudit.findMany({ where: { targetId: id }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, action: true, previous: true, next: true, createdAt: true } }) }, { headers });
  return NextResponse.json({ accounts: await listAccounts() }, { headers });
}
export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== "SUPERADMIN") return NextResponse.json({ error: "Sem permissão." }, { status: admin ? 403 : 401, headers });
  if (!isAccountRequestOriginAllowed(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
  let input; try { input = schema.safeParse(await request.json()); } catch { return NextResponse.json({ error: "Pedido inválido." }, { status: 400, headers }); }
  if (!input.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400, headers });
  try { await changeAccount(admin, input.data); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível alterar a conta." }, { status: 409, headers }); }
  revalidatePath("/admin/utilizadores"); revalidatePath("/conta");
  return NextResponse.json({ accounts: await listAccounts() }, { headers });
}
