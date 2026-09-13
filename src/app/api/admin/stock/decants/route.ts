import { StockMovementReason, StockMovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  mode: z.enum(["KIT", "INDIVIDUAL"]),
  productIds: z.array(z.string().min(1)).min(1).max(5),
  sizeMl: z.union([z.literal(5), z.literal(10)]),
  quantity: z.number().int().positive(),
  customerName: z.string().trim().min(2),
}).superRefine((value, ctx) => {
  if (value.mode === "KIT" && (value.productIds.length !== 5 || new Set(value.productIds).size !== 5 || value.sizeMl !== 5)) {
    ctx.addIssue({ code: "custom", message: "O kit precisa de 5 perfumes diferentes de 5 ml." });
  }
});

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });

  const { mode, productIds, sizeMl, quantity, customerName } = parsed.data;
  const unitPrice = mode === "KIT" ? 330 : sizeMl === 5 ? 350 : 650;
  try {
    await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      if (products.length !== productIds.length) throw new Error("Um dos perfumes selecionados já não existe.");
      for (const productId of productIds) {
        const product = products.find((item) => item.id === productId)!;
        if (sizeMl === 5 && !product.availableInFiveMl) throw new Error(`${product.name} não está disponível em 5 ml.`);
        if (sizeMl === 10 && !product.availableInTenMl) throw new Error(`${product.name} não está disponível em 10 ml.`);
        await tx.stockMovement.create({ data: {
          productId: product.id, type: StockMovementType.SALE, reason: StockMovementReason.DECANT,
          customerName, saleUnitPriceInCents: unitPrice, quantity,
          previousStock: product.stock, resultingStock: product.stock,
          notes: mode === "KIT" ? "Kit de decants · 5 ml" : `Decant individual · ${sizeMl} ml`,
        } });
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível registar a venda." }, { status: 400 });
  }
  revalidatePath("/admin/stock");
  return NextResponse.json({ success: true });
}
