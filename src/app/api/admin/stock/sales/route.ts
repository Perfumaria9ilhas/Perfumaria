import { StockDeliveryStatus, StockMovementReason, StockMovementType, StockSaleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSalePriceInCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  customerName: z.string().trim().min(2),
  lines: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1).max(50),
});

const statusSchema = z.object({
  saleGroupId: z.string().min(1),
  status: z.nativeEnum(StockSaleStatus).optional(),
  deliveryStatus: z.nativeEnum(StockDeliveryStatus).optional(),
  customerName: z.string().trim().min(2).optional(),
  items: z.array(z.object({
    movementId: z.string().min(1),
    productId: z.string().min(1),
    status: z.nativeEnum(StockSaleStatus).optional(),
    deliveryStatus: z.nativeEnum(StockDeliveryStatus).optional(),
    sizeMl: z.union([z.literal(5), z.literal(10)]).optional(),
  })).max(100).optional(),
});

export async function GET() {
  await requireAdmin();
  const movements = await prisma.stockMovement.findMany({
    where: { type: StockMovementType.SALE, customerName: { not: null } },
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const groups = new Map<string, {
    id: string; customerName: string; status: StockSaleStatus; deliveryStatus: StockDeliveryStatus; createdAt: string;
    totalInCents: number; items: { id: string; productId: string; name: string; quantity: number; unitPriceInCents: number; status: StockSaleStatus; deliveryStatus: StockDeliveryStatus; sizeMl: 5 | 10 | null; notes: string | null }[];
  }>();
  for (const movement of movements) {
    const id = movement.saleGroupId ?? movement.id;
    const group = groups.get(id) ?? {
      id,
      customerName: movement.customerName ?? "Cliente",
      status: movement.saleStatus ?? StockSaleStatus.PAID,
      deliveryStatus: movement.deliveryStatus ?? StockDeliveryStatus.DELIVERED,
      createdAt: movement.createdAt.toISOString(),
      totalInCents: 0,
      items: [],
    };
    group.totalInCents += movement.quantity * (movement.saleUnitPriceInCents ?? 0);
    group.items.push({ id: movement.id, productId: movement.productId, name: movement.product.name, quantity: movement.quantity, unitPriceInCents: movement.saleUnitPriceInCents ?? 0, status: movement.saleStatus ?? StockSaleStatus.PAID, deliveryStatus: movement.deliveryStatus ?? StockDeliveryStatus.DELIVERED, sizeMl: movement.notes?.includes("Decant individual") ? (movement.notes.includes("10 ml") ? 10 : 5) : null, notes: movement.notes });
    groups.set(id, group);
  }
  for (const group of groups.values()) {
    group.status = group.items.some((item) => item.status === StockSaleStatus.PENDING)
      ? StockSaleStatus.PENDING
      : group.items.every((item) => item.status === StockSaleStatus.OFFERED)
        ? StockSaleStatus.OFFERED
        : StockSaleStatus.PAID;
    group.deliveryStatus = group.items.some((item) => item.deliveryStatus === StockDeliveryStatus.PENDING)
      ? StockDeliveryStatus.PENDING
      : StockDeliveryStatus.DELIVERED;
  }
  return NextResponse.json({ sales: [...groups.values()] });
}

export async function PATCH(request: Request) {
  await requireAdmin();
  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  try {
    await prisma.$transaction(async (tx) => {
    const movements = await tx.stockMovement.findMany({
      where: { OR: [{ saleGroupId: parsed.data.saleGroupId }, { id: parsed.data.saleGroupId }] },
      include: { product: true },
    });
    if (!movements.length) throw new Error("Venda não encontrada.");
    const itemChanges = new Map((parsed.data.items ?? []).map((item) => [item.movementId, item.productId]));
    const itemStatuses = new Map((parsed.data.items ?? []).map((item) => [item.movementId, item.status]));
    const itemDeliveryStatuses = new Map((parsed.data.items ?? []).map((item) => [item.movementId, item.deliveryStatus]));
    const itemSizes = new Map((parsed.data.items ?? []).map((item) => [item.movementId, item.sizeMl]));
    const requestedProductIds = [...new Set(itemChanges.values())];
    const replacementProducts = requestedProductIds.length
      ? await tx.product.findMany({ where: { id: { in: requestedProductIds } } })
      : [];
    if (replacementProducts.length !== requestedProductIds.length) throw new Error("Um dos perfumes selecionados já não existe.");
    const replacements = new Map(replacementProducts.map((product) => [product.id, product]));

    for (const movement of movements) {
      const nextProductId = itemChanges.get(movement.id) ?? movement.productId;
      const nextProduct = replacements.get(nextProductId) ?? movement.product;
      const isIndividualDecant = movement.notes?.includes("Decant individual") ?? false;
      const nextSizeMl = itemSizes.get(movement.id) ?? (movement.notes?.includes("10 ml") ? 10 : 5);
      if (!nextProduct.active) throw new Error(`${nextProduct.name} já não está disponível no site.`);
      if (movement.reason === StockMovementReason.DECANT) {
        if (nextSizeMl === 10 && !nextProduct.availableInTenMl) throw new Error(`${nextProduct.name} não está disponível em 10 ml.`);
        if (nextSizeMl === 5 && !nextProduct.availableInFiveMl) throw new Error(`${nextProduct.name} não está disponível em 5 ml.`);
      }
      if (nextProductId !== movement.productId && movement.reason === StockMovementReason.SALE) {
        await tx.product.update({ where: { id: movement.productId }, data: { stock: { increment: movement.quantity } } });
        const currentReplacement = await tx.product.findUniqueOrThrow({ where: { id: nextProductId } });
        await tx.product.update({ where: { id: nextProductId }, data: { stock: Math.max(0, currentReplacement.stock - movement.quantity) } });
      }
      await tx.stockMovement.update({
        where: { id: movement.id },
        data: {
          saleGroupId: parsed.data.saleGroupId,
          saleStatus: itemStatuses.get(movement.id) ?? parsed.data.status,
          deliveryStatus: itemDeliveryStatuses.get(movement.id) ?? parsed.data.deliveryStatus,
          customerName: parsed.data.customerName ?? movement.customerName,
          productId: nextProductId,
          saleUnitPriceInCents: isIndividualDecant
            ? (nextSizeMl === 10 ? 650 : 350)
            : nextProductId !== movement.productId && movement.reason === StockMovementReason.SALE
              ? getSalePriceInCents(nextProduct)
              : movement.saleUnitPriceInCents,
          notes: isIndividualDecant ? `Decant individual · ${nextSizeMl} ml` : movement.notes,
        },
      });
    }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível guardar a venda." }, { status: 400 });
  }
  revalidatePath("/admin/stock");
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });

  const quantities = new Map<string, number>();
  for (const line of parsed.data.lines) quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);

  try {
    await prisma.$transaction(async (tx) => {
      const productIds = [...quantities.keys()];
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      if (products.length !== productIds.length) throw new Error("Um dos perfumes selecionados já não existe.");

      for (const product of products) {
        const quantity = quantities.get(product.id)!;
        if (!product.active) throw new Error(`${product.name} já não está disponível no site.`);
        const resultingStock = Math.max(0, product.stock - quantity);
        const updated = await tx.product.updateMany({
          where: { id: product.id, stock: product.stock },
          data: { stock: resultingStock },
        });
        if (updated.count !== 1) throw new Error(`O stock de ${product.name} foi alterado. Tente novamente.`);
        await tx.stockMovement.create({ data: {
          productId: product.id,
          type: StockMovementType.SALE,
          reason: StockMovementReason.SALE,
          customerName: parsed.data.customerName,
          saleUnitPriceInCents: getSalePriceInCents(product),
          quantity,
          previousStock: product.stock,
          resultingStock,
          notes: "Venda de perfumes",
        } });
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível registar a venda." }, { status: 400 });
  }
  revalidatePath("/admin/stock");
  revalidatePath("/catalogo");
  return NextResponse.json({ success: true });
}
