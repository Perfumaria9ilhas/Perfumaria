import { StockMovementReason, StockMovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseEuroPriceToCentsForStock } from "@/lib/stock-utils";

const quickUpdateSchema = z.object({
  salePrice: z.string().optional().default(""),
  stock: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0),
  unitCost: z.string().optional().default(""),
  stockNotes: z.string().nullable().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  await requireAdmin();

  const { productId } = await context.params;
  const json = await request.json();
  const parsed = quickUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  let purchaseCostInCents = 0;
  let salePriceInCents = 0;

  try {
    salePriceInCents = parseEuroPriceToCentsForStock(parsed.data.salePrice);
    purchaseCostInCents = parseEuroPriceToCentsForStock(parsed.data.unitCost);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Preço ou custo inválido.",
      },
      { status: 400 },
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      stock: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        salePriceInCents,
        stock: parsed.data.stock,
        lowStockAlert: parsed.data.lowStockAlert,
        purchaseCostInCents,
        stockNotes: parsed.data.stockNotes?.trim() || null,
      },
    });

    if (product.stock !== parsed.data.stock) {
      await tx.stockMovement.create({
        data: {
          productId,
          type: StockMovementType.ADJUSTMENT,
          reason: StockMovementReason.MANUAL,
          quantity: Math.abs(parsed.data.stock - product.stock),
          previousStock: product.stock,
          resultingStock: parsed.data.stock,
          unitCostInCents: purchaseCostInCents > 0 ? purchaseCostInCents : null,
          notes: "Ajuste manual em linha",
        },
      });
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/stock");

  return NextResponse.json({ success: true });
}
