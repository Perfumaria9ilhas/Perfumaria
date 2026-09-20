import { StockMovementReason, StockMovementType, StockSaleStatus } from "@prisma/client";
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
  status: z.nativeEnum(StockSaleStatus),
});

export async function GET() {
  await requireAdmin();
  const movements = await prisma.stockMovement.findMany({
    where: { type: StockMovementType.SALE, customerName: { not: null } },
    include: { product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const groups = new Map<string, {
    id: string; customerName: string; status: StockSaleStatus; createdAt: string;
    totalInCents: number; items: { name: string; quantity: number; notes: string | null }[];
  }>();
  for (const movement of movements) {
    const id = movement.saleGroupId ?? movement.id;
    const group = groups.get(id) ?? {
      id,
      customerName: movement.customerName ?? "Cliente",
      status: movement.saleStatus ?? StockSaleStatus.PAID,
      createdAt: movement.createdAt.toISOString(),
      totalInCents: 0,
      items: [],
    };
    group.totalInCents += movement.quantity * (movement.saleUnitPriceInCents ?? 0);
    group.items.push({ name: movement.product.name, quantity: movement.quantity, notes: movement.notes });
    groups.set(id, group);
  }
  return NextResponse.json({ sales: [...groups.values()] });
}

export async function PATCH(request: Request) {
  await requireAdmin();
  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  const grouped = await prisma.stockMovement.updateMany({
    where: { saleGroupId: parsed.data.saleGroupId },
    data: { saleStatus: parsed.data.status },
  });
  if (grouped.count === 0) {
    await prisma.stockMovement.update({
      where: { id: parsed.data.saleGroupId },
      data: { saleGroupId: parsed.data.saleGroupId, saleStatus: parsed.data.status },
    });
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
