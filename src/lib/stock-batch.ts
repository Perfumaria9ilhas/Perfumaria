import { Prisma, StockMovementType } from "@prisma/client";
import { z } from "zod";
import { getSalePriceInCents } from "./format";
import { parseEuroPriceToCentsForStock } from "./stock-utils";
import { writeStockProduct, type StockProductChanges } from "./stock-product-update";
const money = z.string().trim().regex(/^\d+(?:[,.]\d{1,2})?$/).refine(v => Number.isFinite(Number(v.replace(",", "."))) && Math.round(Number(v.replace(",", ".")) * 100) <= 2147483647);
export const stockBatchSchema = z.object({ items: z.array(z.object({
  id: z.string().min(1).max(100), version: z.string().datetime(),
  stock: z.number().int().min(0).max(2147483647).optional(),
  sizeLabel: z.string().trim().max(40).regex(/^\d+(?:[.]\d+)? ml$/).refine(v => Number(v.slice(0, -3)) > 0 && Number.isFinite(Number(v.slice(0, -3)))).optional(),
  price: money.refine(v => Number(v.replace(",", ".")) > 0).optional(), unitCost: money.optional(),
}).strict().refine(v => v.stock !== undefined || v.sizeLabel !== undefined || v.price !== undefined || v.unitCost !== undefined)).min(1).max(500).refine(items => new Set(items.map(i => i.id)).size === items.length, "Produtos duplicados.") }).strict();
export type StockBatchIssue = { id: string; error: string };
export class StockBatchError extends Error {
  constructor(public issues: StockBatchIssue[]) { super("Nenhuma alteração foi guardada. Corrija os produtos indicados e tente novamente."); }
}
export async function saveStockBatch(db: Pick<PrismaClientForBatch, "$transaction">, input: z.infer<typeof stockBatchSchema>) {
  return db.$transaction(async tx => {
    const items = [...input.items].sort((a, b) => a.id.localeCompare(b.id));
    // Lock in a stable order; validate every version after acquiring all locks.
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Product" WHERE "id" IN (${Prisma.join(items.map(i => i.id))}) ORDER BY "id" FOR UPDATE`);
    const products = await tx.product.findMany({ where: { id: { in: items.map(i => i.id) } } });
    const previous = new Map(products.map(p => [p.id, p]));
    const issues: StockBatchIssue[] = [];
    for (const item of items) {
      const product = previous.get(item.id);
      if (!product) issues.push({ id: item.id, error: "Produto não encontrado." });
      else if (product.updatedAt.toISOString() !== item.version) issues.push({ id: item.id, error: "Alterado por outra operação. Reveja os valores atuais antes de guardar." });
      else if (item.sizeLabel !== undefined && item.sizeLabel !== product.sizeLabel && await tx.stockMovement.findFirst({ where: { productId: item.id, type: StockMovementType.SALE }, select: { id: true } })) issues.push({ id: item.id, error: "A capacidade está protegida por vendas anteriores. Utilize um produto distinto para outra capacidade." });
    }
    if (issues.length) throw new StockBatchError(issues);
    const saved = [];
    for (const item of items) {
      const product = previous.get(item.id)!;
      const changes: StockProductChanges = { ...(item.stock !== undefined ? { stock: item.stock } : {}), ...(item.sizeLabel !== undefined ? { sizeLabel: item.sizeLabel } : {}), ...(item.unitCost !== undefined ? { purchaseCostInCents: parseEuroPriceToCentsForStock(item.unitCost) } : {}) };
      if (item.price !== undefined) {
        const cents = parseEuroPriceToCentsForStock(item.price);
        if (cents !== getSalePriceInCents(product)) {
          const promotion = getSalePriceInCents(product) < product.priceInCents;
          if (promotion && cents < product.priceInCents) changes.salePriceInCents = cents;
          else { changes.priceInCents = cents; if (promotion) changes.salePriceInCents = cents; }
        }
      }
      try {
        const updated = await writeStockProduct(tx, product, changes, "Edição em lote no Admin");
        saved.push({ id: updated.id, stock: updated.stock, sizeLabel: updated.sizeLabel, basePriceInCents: updated.priceInCents, salePriceInCents: getSalePriceInCents(updated), unitCostInCents: updated.purchaseCostInCents, updatedAt: updated.updatedAt.toISOString() });
      } catch (error) {
        const known = error instanceof Error && /^(Este produto tem vendas anteriores|O produto foi alterado entretanto)/.test(error.message);
        throw new StockBatchError([{ id: item.id, error: known ? error.message : "Falha ao guardar este produto. O lote foi revertido." }]);
      }
    }
    return saved;
  }, { maxWait: 10000, timeout: 60000 });
}
type PrismaClientForBatch = import("@prisma/client").PrismaClient;
