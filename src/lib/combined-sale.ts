import { recordInitialSalePayment } from "./sale-accounts";
import { randomUUID, createHash } from "node:crypto";
import { StockDeliveryStatus, StockMovementReason, StockMovementType, StockSaleStatus, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getSalePriceInCents } from "@/lib/format";
import { getDecantPriceInCents } from "@/lib/product-sizes";
export const combinedSaleSchema = z.object({
  customerName: z.string().trim().min(2),
  saleOrigin: z.enum(["WhatsApp", "Instagram", "Facebook", "Site", "Feira", "Presencial", "Google", "Outro"]).optional().nullable(),
  status: z.nativeEnum(StockSaleStatus),
  deliveryStatus: z.nativeEnum(StockDeliveryStatus),
  perfumeLines: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive() })).max(50),
  decantLines: z.array(z.object({ productId: z.string().min(1), sizeMl: z.union([z.literal(5), z.literal(10)]), quantity: z.number().int().positive() })).max(50),
  kitProductIds: z.array(z.string().min(1)).max(5).default([]),
  kits: z.array(z.object({ id: z.string().uuid(), productIds: z.array(z.string().min(1)).length(5).refine(ids => new Set(ids).size === 5, "O kit precisa de cinco perfumes diferentes.") })).max(100).default([]),
  requestId: z.string().uuid().optional(),
  expectedPrices: z.record(z.string(), z.number().int().nonnegative()).optional(),
  kitQuantity: z.number().int().positive().max(100).default(1),
}).superRefine((value, ctx) => {
  if (value.kits.length && value.kitProductIds.length) ctx.addIssue({ code: "custom", message: "Não misture a configuração antiga de kits com kits independentes." });
  if (new Set(value.kits.map(kit => kit.id)).size !== value.kits.length) ctx.addIssue({ code: "custom", message: "Kits duplicados." });
  if (!value.perfumeLines.length && !value.decantLines.length && !value.kitProductIds.length && !value.kits.length) ctx.addIssue({ code: "custom", message: "Adicione pelo menos um perfume, decant ou kit." });
  if (value.kitProductIds.length && (value.kitProductIds.length !== 5 || new Set(value.kitProductIds).size !== 5)) ctx.addIssue({ code: "custom", message: "O kit precisa de 5 perfumes diferentes." });
});

export class CombinedSalePriceError extends Error {
  constructor(public currentPrices: Record<string, number>) { super("Os preços mudaram desde a preparação do rascunho. Reveja e atualize os preços antes de registar."); }
}
export async function saveCombinedSale(db: Pick<PrismaClient, "$transaction">, data: z.infer<typeof combinedSaleSchema>, actor?: { id: string; name: string; kind: string }) {

  const saleGroupId = data.requestId ?? randomUUID();
  const signature = createHash("sha256").update(JSON.stringify(data)).digest("hex");
  const audit = data.requestId ? ` [pedido:${signature}]` : "";
  const allIds = [...new Set([...data.perfumeLines.map((line) => line.productId), ...data.decantLines.map((line) => line.productId), ...data.kitProductIds, ...data.kits.flatMap(kit => kit.productIds)])];
  return db.$transaction(async (tx) => {
      if (data.requestId) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${data.requestId}, 0))`;
      // Lock in a stable order so a capacity edit cannot race a first sale.
      await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id" = ANY(${allIds}::text[]) ORDER BY "id" FOR UPDATE`;
      if (data.requestId) {
        const existing = await tx.stockMovement.findMany({ where: { saleGroupId, type: StockMovementType.SALE } });
        if (existing.length) {
          if (!existing.every(item => item.notes?.includes(`[pedido:${signature}]`))) throw Error("Este pedido já foi registado com dados diferentes. Consulte o Estado das vendas.");
          return { saleGroupId, totalInCents: existing.reduce((sum, item) => sum + (item.saleStatus === StockSaleStatus.OFFERED ? 0 : item.quantity * (item.saleUnitPriceInCents ?? 0)), 0), alreadyRecorded: true };
        }
      }
      const products = await tx.product.findMany({ where: { id: { in: allIds } } });
      if (products.length !== allIds.length) throw new Error("Um dos produtos selecionados já não existe.");
      const productById = new Map(products.map((product) => [product.id, product]));
      const currentPrices = Object.fromEntries(products.map(product => [product.id, getSalePriceInCents(product)]));
      if (data.expectedPrices && Object.keys(data.expectedPrices).some(id => allIds.includes(id) && data.expectedPrices?.[id] !== currentPrices[id])) throw new CombinedSalePriceError(currentPrices);
      const perfumeQuantities = new Map<string, number>();
      for (const line of data.perfumeLines) perfumeQuantities.set(line.productId, (perfumeQuantities.get(line.productId) ?? 0) + line.quantity);
      for (const [productId, quantity] of perfumeQuantities) {
        const product = productById.get(productId)!;
        if (!product.active) throw new Error(`${product.name} já não está disponível no site.`);
        if (quantity > product.stock) throw new Error(`Stock insuficiente para ${product.name}. Disponível: ${product.stock}.`);
        const resultingStock = product.stock - quantity;
        const updated = await tx.product.updateMany({ where: { id: product.id, stock: product.stock }, data: { stock: resultingStock } });
        if (updated.count !== 1) throw new Error(`O stock de ${product.name} foi alterado. Tente novamente.`);
        await tx.stockMovement.create({ data: { productId, type: StockMovementType.SALE, reason: StockMovementReason.SALE, customerName: data.customerName, saleOrigin: data.saleOrigin, saleGroupId, saleStatus: data.status, deliveryStatus: data.deliveryStatus, saleUnitPriceInCents: getSalePriceInCents(product), quantity, unitCostInCents: product.purchaseCostInCents > 0 ? product.purchaseCostInCents : null, previousStock: product.stock, resultingStock, notes: "Venda de perfume" + audit } });
      }
      const decants = [
        ...data.kits.flatMap((kit, index) => kit.productIds.map(productId => ({ productId, sizeMl: 5 as const, quantity: 1, kit: true as const, note: `Kit de decants · 5 ml · Kit ${index + 1} [kit:${kit.id}]` }))),
        ...data.decantLines.map((line) => ({ ...line, kit: false as const, note: `Decant individual · ${line.sizeMl} ml` })),
        ...data.kitProductIds.map((productId) => ({ productId, sizeMl: 5 as const, quantity: data.kitQuantity, kit: true as const, note: `Kit de decants · 5 ml · ${data.kitQuantity} kit${data.kitQuantity === 1 ? "" : "s"}` })),
      ];
      for (const line of decants) {
        const product = productById.get(line.productId)!;
        if (!product.active) throw new Error(`${product.name} já não está disponível no site.`);
        if (line.sizeMl === 5 && !product.availableInFiveMl) throw new Error(`${product.name} não está disponível em 5 ml.`);
        if (line.sizeMl === 10 && !product.availableInTenMl) throw new Error(`${product.name} não está disponível em 10 ml.`);
        const volume = product.sizeLabel.match(/^(\d+(?:[.,]\d+)?)\s*ml$/i);
        const bottleMl = volume ? Number(volume[1].replace(",", ".")) : 0;
        const unitCostInCents = product.purchaseCostInCents > 0 && bottleMl > 0 ? Math.round(product.purchaseCostInCents * line.sizeMl / bottleMl) : null;
        const price = line.kit ? 330 : getDecantPriceInCents(getSalePriceInCents(product), line.sizeMl === 5 ? "5ml" : "10ml");
        await tx.stockMovement.create({ data: { productId: product.id, type: StockMovementType.SALE, reason: StockMovementReason.DECANT, customerName: data.customerName, saleOrigin: data.saleOrigin, saleGroupId, saleStatus: data.status, deliveryStatus: data.deliveryStatus, saleUnitPriceInCents: price, quantity: line.quantity, unitCostInCents, previousStock: product.stock - (perfumeQuantities.get(product.id) ?? 0), resultingStock: product.stock - (perfumeQuantities.get(product.id) ?? 0), notes: line.note + audit } });
      }
      const movements = await tx.stockMovement.findMany({ where: { saleGroupId, type: StockMovementType.SALE } });
      if (actor) await recordInitialSalePayment(tx, saleGroupId, actor);
      return { saleGroupId, totalInCents: data.status === StockSaleStatus.OFFERED ? 0 : movements.reduce((sum, item) => sum + item.quantity * (item.saleUnitPriceInCents ?? 0), 0), alreadyRecorded: false };
  }, { maxWait: 10000, timeout: 60000 });
}
