import { StockMovementReason, StockMovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  mode: z.enum(["KIT", "INDIVIDUAL"]),
  productIds: z.array(z.string().min(1)).min(1).max(30),
  sizeMl: z.union([z.literal(5), z.literal(10)]).optional(),
  quantity: z.number().int().positive().optional(),
  lines: z.array(z.object({
    productId: z.string().min(1),
    sizeMl: z.union([z.literal(5), z.literal(10)]),
    quantity: z.number().int().positive(),
  })).min(1).max(30).optional(),
  customerName: z.string().trim().min(2),
}).superRefine((value, ctx) => {
  if (value.mode === "KIT" && (value.productIds.length !== 5 || new Set(value.productIds).size !== 5 || value.sizeMl !== 5)) {
    ctx.addIssue({ code: "custom", message: "O kit precisa de 5 perfumes diferentes de 5 ml." });
  }
  if (value.mode === "INDIVIDUAL" && !value.lines?.length) {
    ctx.addIssue({ code: "custom", message: "Adicione pelo menos um decant." });
  }
});

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });

  const { mode, productIds, customerName } = parsed.data;
  const lines = mode === "KIT"
    ? productIds.map((productId) => ({ productId, sizeMl: 5 as const, quantity: 1, unitPrice: 330 }))
    : parsed.data.lines!.map((line) => ({ ...line, unitPrice: line.sizeMl === 5 ? 350 : 650 }));
  try {
    await prisma.$transaction(async (tx) => {
      const uniqueProductIds = [...new Set(lines.map((line) => line.productId))];
      const products = await tx.product.findMany({ where: { id: { in: uniqueProductIds } } });
      if (products.length !== uniqueProductIds.length) throw new Error("Um dos perfumes selecionados já não existe.");
      for (const line of lines) {
        const product = products.find((item) => item.id === line.productId)!;
        if (!product.active) throw new Error(`${product.name} já não está disponível no site.`);
        if (line.sizeMl === 5 && !product.availableInFiveMl) throw new Error(`${product.name} não está disponível em 5 ml.`);
        if (line.sizeMl === 10 && !product.availableInTenMl) throw new Error(`${product.name} não está disponível em 10 ml.`);
        await tx.stockMovement.create({ data: {
          productId: product.id, type: StockMovementType.SALE, reason: StockMovementReason.DECANT,
          customerName, saleUnitPriceInCents: line.unitPrice, quantity: line.quantity,
          previousStock: product.stock, resultingStock: product.stock,
          notes: mode === "KIT" ? "Kit de decants · 5 ml" : `Decant individual · ${line.sizeMl} ml`,
        } });
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível registar a venda." }, { status: 400 });
  }
  revalidatePath("/admin/stock");
  return NextResponse.json({ success: true });
}
