import { type Prisma, type Product, StockMovementReason, StockMovementType } from "@prisma/client";

type StockProduct = Pick<Product, "id" | "stock" | "lowStockAlert" | "active" | "purchaseCostInCents" | "salePriceInCents" | "stockNotes" | "priceInCents" | "sizeLabel" | "updatedAt">;
export type StockProductChanges = Partial<Pick<StockProduct, "stock" | "lowStockAlert" | "active" | "purchaseCostInCents" | "salePriceInCents" | "stockNotes" | "priceInCents" | "sizeLabel">>;
export async function writeStockProduct(tx: Prisma.TransactionClient, product: StockProduct, changes: StockProductChanges, label = "Edição rápida no Admin") {
  if (Object.entries(changes).every(([key, value]) => product[key as keyof StockProduct] === value)) return product;
  if (changes.sizeLabel !== undefined && changes.sizeLabel !== product.sizeLabel) {
    const sale = await tx.stockMovement.findFirst({ where: { productId: product.id, type: StockMovementType.SALE }, select: { id: true } });
    if (sale) throw Error("Este produto tem vendas anteriores. Para outra capacidade, utilize um produto distinto; as vendas antigas mantêm a capacidade original.");
  }
  const updated = await tx.product.updateMany({ where: { id: product.id, updatedAt: product.updatedAt, stock: product.stock }, data: { ...changes, updatedAt: new Date(Math.max(Date.now(), product.updatedAt.getTime() + 1)) } });
  if (updated.count !== 1) throw Error("O produto foi alterado entretanto. Reveja os valores atuais antes de guardar.");
  const resultingStock = changes.stock ?? product.stock;
  const previous = Object.fromEntries(Object.keys(changes).map(key => [key, product[key as keyof StockProduct]]));
  await tx.stockMovement.create({ data: {
    productId: product.id, type: StockMovementType.ADJUSTMENT, reason: StockMovementReason.MANUAL,
    quantity: Math.abs(resultingStock - product.stock), previousStock: product.stock, resultingStock,
    unitCostInCents: changes.purchaseCostInCents ?? product.purchaseCostInCents,
    notes: `${label} · ${JSON.stringify({ anterior: previous, novo: changes })}`,
  } });
  return tx.product.findUniqueOrThrow({ where: { id: product.id } });
}
