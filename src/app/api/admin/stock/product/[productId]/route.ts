import { after } from "next/server";
import { notifyAdminSafely } from "@/lib/admin-push";
import { writeStockProduct } from "@/lib/stock-product-update";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseEuroPriceToCentsForStock } from "@/lib/stock-utils";

const quickUpdateSchema = z.object({
  salePrice: z.string().optional(),
  basePrice: z.string().optional(),
  sizeLabel: z.string().trim().min(1).max(40).optional(),
  version: z.string().datetime().optional(),
  stock: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0),
  unitCost: z.string().optional(),
  stockNotes: z.string().nullable().optional(),
  active: z.boolean().optional(),
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
  let priceInCents = 0;

  try {
    if (parsed.data.basePrice !== undefined) priceInCents = parseEuroPriceToCentsForStock(parsed.data.basePrice);
    if (parsed.data.salePrice !== undefined) salePriceInCents = parseEuroPriceToCentsForStock(parsed.data.salePrice);
    if (parsed.data.unitCost !== undefined) purchaseCostInCents = parseEuroPriceToCentsForStock(parsed.data.unitCost);
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
      lowStockAlert: true,
      active: true,
      purchaseCostInCents: true,
      salePriceInCents: true,
      stockNotes: true,
      priceInCents: true,
      sizeLabel: true,
      updatedAt: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  if (parsed.data.basePrice !== undefined && priceInCents <= 0) return NextResponse.json({ error: "O preço base deve ser superior a zero." }, { status: 400 });

  if (parsed.data.version && product.updatedAt.toISOString() !== parsed.data.version) {
    return NextResponse.json({ error: "Este produto foi alterado. Atualize a página antes de guardar." }, { status: 409 });
  }
  const changes = {
    ...(parsed.data.basePrice !== undefined ? { priceInCents } : {}),
    ...(parsed.data.sizeLabel !== undefined ? { sizeLabel: parsed.data.sizeLabel } : {}),
    stock: parsed.data.stock,
    lowStockAlert: parsed.data.lowStockAlert,
    ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
    ...(parsed.data.salePrice !== undefined ? { salePriceInCents } : {}),
    ...(parsed.data.unitCost !== undefined ? { purchaseCostInCents } : {}),
    ...(parsed.data.stockNotes !== undefined ? { stockNotes: parsed.data.stockNotes?.trim() || null } : {}),
  };
  // Saving unchanged values must not create a movement or alter timestamps.
  if (Object.entries(changes).every(([key, value]) => product[key as keyof typeof product] === value)) {
    return NextResponse.json({ success: true, unchanged: true });
  }

  let version = product.updatedAt.toISOString();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id" = ${productId} FOR UPDATE`;
      version = (await writeStockProduct(tx, product, changes)).updatedAt.toISOString();
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível guardar." }, { status: 409 });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/stock");
  revalidatePath("/admin/produtos");
  revalidatePath("/catalogo");
  revalidatePath("/", "layout");
  revalidatePath("/admin/estatisticas");

  after(notifyAdminSafely);
  return NextResponse.json({ success: true, version });
}
