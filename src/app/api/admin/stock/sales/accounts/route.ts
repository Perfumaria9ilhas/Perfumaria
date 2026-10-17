import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { isAccountRequestOriginAllowed } from "@/lib/account-request-origin";
import { prisma } from "@/lib/prisma";
import { changeSaleAccount, getSaleAccounts, saleAccountCommand, SaleConflict } from "@/lib/sale-accounts";

export async function GET() {
  await requireAdmin();
  return NextResponse.json({ sales: await getSaleAccounts() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const actor = await requireAdmin();
  if (!isAccountRequestOriginAllowed(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const parsed = saleAccountCommand.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos. Reveja o valor, data e produto." }, { status: 400 });
  try {
    const result = await changeSaleAccount(prisma, parsed.data, actor);
    for (const path of ["/admin", "/admin/stock", "/admin/estatisticas"]) revalidatePath(path);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível guardar." }, { status: error instanceof SaleConflict ? 409 : 400 });
  }
}
