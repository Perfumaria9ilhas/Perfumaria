import { randomUUID } from "node:crypto";
import { StockDeliveryStatus, StockMovementReason, StockMovementType, StockSaleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSalePriceInCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  customerName: z.string().trim().min(2),
  status: z.nativeEnum(StockSaleStatus),
  deliveryStatus: z.nativeEnum(StockDeliveryStatus),
  perfumeLines: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive() })).max(50),
  decantLines: z.array(z.object({ productId: z.string().min(1), sizeMl: z.union([z.literal(5), z.literal(10)]), quantity: z.number().int().positive() })).max(50),
  kitProductIds: z.array(z.string().min(1)).max(5),
  kitQuantity: z.number().int().positive().max(100).default(1),
}).superRefine((value, ctx) => {
  if (!value.perfumeLines.length && !value.decantLines.length && !value.kitProductIds.length) ctx.addIssue({ code: "custom", message: "Adicione pelo menos um perfume, decant ou kit." });
  if (value.kitProductIds.length && (value.kitProductIds.length !== 5 || new Set(value.kitProductIds).size !== 5)) ctx.addIssue({ code: "custom", message: "O kit precisa de 5 perfumes diferentes." });
});

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  const data = parsed.data;
  const saleGroupId = randomUUID();
  const allIds = [...new Set([...data.perfumeLines.map((line) => line.productId), ...data.decantLines.map((line) => line.productId), ...data.kitProductIds])];
  try {
    await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: allIds } } });
      if (products.length !== allIds.length) throw new Error("Um dos produtos selecionados já não existe.");
      const productById = new Map(products.map((product) => [product.id, product]));
      const perfumeQuantities = new Map<string, number>();
      for (const line of data.perfumeLines) perfumeQuantities.set(line.productId, (perfumeQuantities.get(line.productId) ?? 0) + line.quantity);
      for (const [productId, quantity] of perfumeQuantities) {
        const product = productById.get(productId)!;
        if (!product.active) throw new Error(`${product.name} já não está disponível no site.`);
        const resultingStock = Math.max(0, product.stock - quantity);
        const updated = await tx.product.updateMany({ where: { id: product.id, stock: product.stock }, data: { stock: resultingStock } });
        if (updated.count !== 1) throw new Error(`O stock de ${product.name} foi alterado. Tente novamente.`);
        await tx.stockMovement.create({ data: { productId, type: StockMovementType.SALE, reason: StockMovementReason.SALE, customerName: data.customerName, saleGroupId, saleStatus: data.status, deliveryStatus: data.deliveryStatus, saleUnitPriceInCents: getSalePriceInCents(product), quantity, previousStock: product.stock, resultingStock, notes: "Venda de perfume" } });
      }
      const decants = [
        ...data.decantLines.map((line) => ({ ...line, price: line.sizeMl === 5 ? 350 : 650, note: `Decant individual · ${line.sizeMl} ml` })),
        ...data.kitProductIds.map((productId) => ({ productId, sizeMl: 5 as const, quantity: data.kitQuantity, price: 330, note: `Kit de decants · 5 ml · ${data.kitQuantity} kit${data.kitQuantity === 1 ? "" : "s"}` })),
      ];
      for (const line of decants) {
        const product = productById.get(line.productId)!;
        if (!product.active) throw new Error(`${product.name} já não está disponível no site.`);
        if (line.sizeMl === 5 && !product.availableInFiveMl) throw new Error(`${product.name} não está disponível em 5 ml.`);
        if (line.sizeMl === 10 && !product.availableInTenMl) throw new Error(`${product.name} não está disponível em 10 ml.`);
        await tx.stockMovement.create({ data: { productId: product.id, type: StockMovementType.SALE, reason: StockMovementReason.DECANT, customerName: data.customerName, saleGroupId, saleStatus: data.status, deliveryStatus: data.deliveryStatus, saleUnitPriceInCents: line.price, quantity: line.quantity, previousStock: product.stock, resultingStock: product.stock, notes: line.note } });
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível registar a venda." }, { status: 400 });
  }
  revalidatePath("/admin/stock");
  revalidatePath("/catalogo");
  return NextResponse.json({ success: true });
}
