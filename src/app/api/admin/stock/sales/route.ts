import { after } from "next/server";
import { notifyAdminSafely } from "@/lib/admin-push";
import { StockDeliveryStatus, StockMovementReason, StockMovementType, StockSaleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { summarizePaidSales } from "@/lib/admin-dashboard-sales";
import { requireAdmin } from "@/lib/auth";
import { getSalePriceInCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getDecantPriceInCents } from "@/lib/product-sizes";

const schema = z.object({
  customerName: z.string().trim().min(2),
  saleOrigin: z.enum(["WhatsApp", "Instagram", "Facebook", "Site", "Feira", "Presencial", "Google", "Outro"]).optional().nullable(),
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
  saleOrigin: z.enum(["WhatsApp", "Instagram", "Facebook", "Site", "Feira", "Presencial", "Google", "Outro"]).optional().nullable(),
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
    include: { product: { select: { name: true, purchaseCostInCents: true, sizeLabel: true } } },
    orderBy: { createdAt: "desc" },
  });
  const groups = new Map<string, {
    id: string; customerName: string; saleOrigin: string | null; status: StockSaleStatus; deliveryStatus: StockDeliveryStatus; createdAt: string;
    totalInCents: number; items: { id: string; productId: string; name: string; quantity: number; unitPriceInCents: number; status: StockSaleStatus; deliveryStatus: StockDeliveryStatus; sizeMl: 5 | 10 | null; notes: string | null }[];
  }>();
  for (const movement of movements) {
    const id = movement.saleGroupId ?? movement.id;
    const group = groups.get(id) ?? {
      id,
      customerName: movement.customerName ?? "Cliente",
      saleOrigin: movement.saleOrigin,
      status: movement.saleStatus ?? StockSaleStatus.PAID,
      deliveryStatus: movement.deliveryStatus ?? StockDeliveryStatus.DELIVERED,
      createdAt: movement.createdAt.toISOString(),
      totalInCents: 0,
      items: [],
    };
    group.totalInCents += movement.saleStatus === StockSaleStatus.OFFERED ? 0 : movement.quantity * (movement.saleUnitPriceInCents ?? 0);
    group.items.push({ id: movement.id, productId: movement.productId, name: movement.product.name, quantity: movement.quantity, unitPriceInCents: movement.saleUnitPriceInCents ?? 0, status: movement.saleStatus ?? StockSaleStatus.PAID, deliveryStatus: movement.deliveryStatus ?? StockDeliveryStatus.DELIVERED, sizeMl: movement.notes?.includes("Decant individual") ? (movement.notes.includes("10 ml") ? 10 : 5) : null, notes: movement.notes });
    groups.set(id, group);
  }
  const movementGroups = new Map<string, typeof movements>();
  for (const movement of movements) { const key = movement.saleGroupId ?? movement.id; movementGroups.set(key, [...(movementGroups.get(key) ?? []), movement]); }
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
  return NextResponse.json({ sales: [...groups.values()].map(group => ({ ...group, profit: summarizePaidSales(movementGroups.get(group.id) ?? []) })) });
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
      const formatChanged = isIndividualDecant && itemSizes.has(movement.id) && nextSizeMl !== (movement.notes?.includes("10 ml") ? 10 : 5);
      const productChanged = nextProductId !== movement.productId;
      if (productChanged && !nextProduct.active) throw new Error(`${nextProduct.name} já não está disponível no site.`);
      if (movement.reason === StockMovementReason.DECANT && (productChanged || formatChanged)) {
        if (nextSizeMl === 10 && !nextProduct.availableInTenMl) throw new Error(`${nextProduct.name} não está disponível em 10 ml.`);
        if (nextSizeMl === 5 && !nextProduct.availableInFiveMl) throw new Error(`${nextProduct.name} não está disponível em 5 ml.`);
      }
      if (nextProductId !== movement.productId && movement.reason === StockMovementReason.SALE) {
        await tx.product.update({ where: { id: movement.productId }, data: { stock: { increment: movement.quantity } } });
        const currentReplacement = await tx.product.findUniqueOrThrow({ where: { id: nextProductId } });
        if (movement.quantity > currentReplacement.stock) throw new Error(`Stock insuficiente para ${currentReplacement.name}. Disponível: ${currentReplacement.stock}.`);
        await tx.product.update({ where: { id: nextProductId }, data: { stock: currentReplacement.stock - movement.quantity } });
      }
      const nextPayment = itemStatuses.get(movement.id) ?? (movement.saleStatus === StockSaleStatus.OFFERED && parsed.data.status !== StockSaleStatus.OFFERED ? StockSaleStatus.OFFERED : parsed.data.status ?? movement.saleStatus);
      const nextDelivery = itemDeliveryStatuses.get(movement.id) ?? parsed.data.deliveryStatus ?? movement.deliveryStatus;
      if (nextPayment !== movement.saleStatus || nextDelivery !== movement.deliveryStatus) {
        await tx.stockMovement.create({ data: {
          productId: movement.productId, type: StockMovementType.ADJUSTMENT, reason: StockMovementReason.MANUAL,
          quantity: 0, previousStock: movement.product.stock, resultingStock: movement.product.stock,
          notes: `Estado da venda ${parsed.data.saleGroupId} · ${JSON.stringify({ anterior: { pagamento: movement.saleStatus, entrega: movement.deliveryStatus }, novo: { pagamento: nextPayment, entrega: nextDelivery } })}`,
        } });
      }
      let nextUnitCost = movement.unitCostInCents;
      if (productChanged || formatChanged) {
        nextUnitCost = nextProduct.purchaseCostInCents > 0 ? nextProduct.purchaseCostInCents : null;
        if (movement.reason === StockMovementReason.DECANT && nextUnitCost !== null) {
          const volume = nextProduct.sizeLabel.match(/^(\d+(?:[.,]\d+)?)\s*ml$/i);
          nextUnitCost = volume && Number(volume[1].replace(",", ".")) > 0 ? Math.round(nextUnitCost * nextSizeMl / Number(volume[1].replace(",", "."))) : null;
        }
      }
      await tx.stockMovement.update({
        where: { id: movement.id },
        data: {
          unitCostInCents: nextUnitCost,
          saleGroupId: parsed.data.saleGroupId,
          saleStatus: nextPayment,
          deliveryStatus: itemDeliveryStatuses.get(movement.id) ?? parsed.data.deliveryStatus,
          customerName: parsed.data.customerName ?? movement.customerName,
          saleOrigin: parsed.data.saleOrigin === undefined ? movement.saleOrigin : parsed.data.saleOrigin,
          productId: nextProductId,
          saleUnitPriceInCents: isIndividualDecant && (productChanged || formatChanged)
            ? getDecantPriceInCents(getSalePriceInCents(nextProduct), nextSizeMl === 10 ? "10ml" : "5ml")
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
  revalidatePath("/admin");
  revalidatePath("/admin/estatisticas");
  after(notifyAdminSafely);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  await requireAdmin();
  const parsed = z.object({ saleGroupId: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Venda inválida." }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const movements = await tx.stockMovement.findMany({
        where: {
          type: StockMovementType.SALE,
          OR: [
            { saleGroupId: parsed.data.saleGroupId },
            { id: parsed.data.saleGroupId },
          ],
        },
      });

      if (!movements.length) throw new Error("Venda não encontrada.");

      const stockToRestore = new Map<string, number>();
      for (const movement of movements) {
        if (movement.reason !== StockMovementReason.SALE) continue;
        const deductedQuantity = Math.max(0, movement.previousStock - movement.resultingStock);
        stockToRestore.set(
          movement.productId,
          (stockToRestore.get(movement.productId) ?? 0) + deductedQuantity,
        );
      }

      for (const [productId, quantity] of stockToRestore) {
        if (quantity > 0) {
          await tx.product.update({
            where: { id: productId },
            data: { stock: { increment: quantity } },
          });
        }
      }

      await tx.stockMovement.deleteMany({
        where: { id: { in: movements.map((movement) => movement.id) } },
      });
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível eliminar a venda." },
      { status: 400 },
    );
  }

  revalidatePath("/admin/stock");
  revalidatePath("/admin");
  revalidatePath("/admin/estatisticas");
  revalidatePath("/catalogo");
  after(notifyAdminSafely);
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
        if (quantity > product.stock) throw new Error(`Stock insuficiente para ${product.name}. Disponível: ${product.stock}.`);
        const resultingStock = product.stock - quantity;
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
          saleOrigin: parsed.data.saleOrigin,
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
  revalidatePath("/admin");
  revalidatePath("/admin/estatisticas");
  revalidatePath("/catalogo");
  after(notifyAdminSafely);
  return NextResponse.json({ success: true });
}
