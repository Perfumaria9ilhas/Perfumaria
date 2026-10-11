import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { isAccountRequestOriginAllowed } from "@/lib/account-request-origin";
import { prisma } from "@/lib/prisma";
import { notifyAdminSafely } from "@/lib/admin-push";
import { stockBatchSchema, saveStockBatch, StockBatchError } from "@/lib/stock-batch";
import { getSalePriceInCents } from "@/lib/format";
export async function GET(request: Request) {
  await requireAdmin();
  const ids = new URL(request.url).searchParams.getAll("id");
  if (!ids.length || ids.length > 500 || ids.some(id => id.length > 100)) return NextResponse.json({ error: "Produtos inválidos." }, { status: 400 });
  const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, stock: true, sizeLabel: true, priceInCents: true, salePriceInCents: true, purchaseCostInCents: true, updatedAt: true } });
  return NextResponse.json({ rows: products.map(p => ({ id: p.id, stock: p.stock, sizeLabel: p.sizeLabel, basePriceInCents: p.priceInCents, salePriceInCents: getSalePriceInCents(p), unitCostInCents: p.purchaseCostInCents, updatedAt: p.updatedAt.toISOString() })) }, { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(request: Request) {
  await requireAdmin();
  const headers = { "Cache-Control": "no-store" };
  if (!isAccountRequestOriginAllowed(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
  const body = await request.json().catch(() => null);
  const parsed = stockBatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos. Nenhuma alteração foi guardada.", issues: parsed.error.issues.map(issue => ({ id: typeof issue.path[1] === "number" && typeof body?.items?.[issue.path[1]]?.id === "string" ? body.items[issue.path[1]].id : "", error: issue.message })) }, { status: 400, headers });
  try {
    const rows = await saveStockBatch(prisma, parsed.data);
    revalidatePath("/admin"); revalidatePath("/admin/stock"); revalidatePath("/admin/produtos"); revalidatePath("/admin/estatisticas"); revalidatePath("/catalogo"); revalidatePath("/", "layout");
    after(notifyAdminSafely);
    return NextResponse.json({ success: true, rows }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof StockBatchError ? error.message : "Não foi possível guardar o lote. Nenhuma alteração foi guardada; tente novamente.", issues: error instanceof StockBatchError ? error.issues : parsed.data.items.map(item => ({ id: item.id, error: "Não guardado: o lote foi revertido." })) }, { status: 409, headers });
  }
}
