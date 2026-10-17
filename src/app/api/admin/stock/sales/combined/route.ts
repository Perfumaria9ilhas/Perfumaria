import { after } from "next/server";
import { notifyAdminSafely } from "@/lib/admin-push";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAccountRequestOriginAllowed } from "@/lib/account-request-origin";
import { combinedSaleSchema, saveCombinedSale, CombinedSalePriceError } from "@/lib/combined-sale";
export async function POST(request: Request) {
  const actor = await requireAdmin();
  if (!isAccountRequestOriginAllowed(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const parsed = combinedSaleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  try {
    const result = await saveCombinedSale(prisma, parsed.data, actor);
    revalidatePath("/admin/stock"); revalidatePath("/admin"); revalidatePath("/admin/estatisticas"); revalidatePath("/catalogo");
    if (!result.alreadyRecorded) after(notifyAdminSafely);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível registar a venda.", ...(error instanceof CombinedSalePriceError ? { currentPrices: error.currentPrices } : {}) }, { status: 400 });
  }
}
