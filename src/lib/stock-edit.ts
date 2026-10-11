import { type AdminStockRow, getStockStatus } from "./stock";

export type InlineStockDraft = { original: AdminStockRow; size: string; price: string; stock: string; cost: string };
export type StockEditField = "size" | "price" | "stock" | "cost";
const euro = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
export function stockDraft(row: AdminStockRow): InlineStockDraft {
  return { original: row, size: row.sizeLabel || "", price: euro(row.salePriceInCents), stock: String(row.stock), cost: euro(row.unitCostInCents) };
}
export function changedStockFields(draft: InlineStockDraft) {
  const initial = stockDraft(draft.original);
  return (["size", "price", "stock", "cost"] as const).filter(field => draft[field] !== initial[field]);
}
export function stockEditPayload(draft: InlineStockDraft) {
  const changed = changedStockFields(draft);
  const item: { id: string; version: string; stock?: number; sizeLabel?: string; price?: string; unitCost?: string } = { id: draft.original.id, version: draft.original.updatedAt };
  for (const field of changed) {
    const text = draft[field].trim();
    if (field === "stock") {
      if (!/^\d+$/.test(text) || Number(text) > 2147483647) throw Error("O stock deve ser inteiro, entre 0 e 2147483647.");
      item.stock = Number(text);
    } else if (field === "size") {
      const capacity = text.match(/^(\d+(?:[.,]\d+)?)\s*(?:ml)?$/i);
      if (!capacity || !Number.isFinite(Number(capacity[1].replace(",", "."))) || Number(capacity[1].replace(",", ".")) <= 0 || text.length > 40) throw Error("Introduza mililitros superiores a zero, por exemplo 100 ml.");
      item.sizeLabel = `${Number(capacity[1].replace(",", "."))} ml`;
    } else {
      const amount = Number(text.replace(",", "."));
      if (!/^\d+(?:[,.]\d{1,2})?$/.test(text) || !Number.isFinite(amount) || Math.round(amount * 100) > 2147483647 || (field === "price" && amount <= 0)) throw Error(field === "price" ? "O preço de venda deve ser superior a zero, com até duas casas decimais." : "O preço fornecedor deve ser igual ou superior a zero, com até duas casas decimais.");
      if (field === "price") item.price = text; else item.unitCost = text;
    }
  }
  return item;
}
export type SavedStockEdit = { id: string; stock: number; sizeLabel: string; salePriceInCents: number; basePriceInCents: number; unitCostInCents: number; updatedAt: string };
export function applySavedStockEdit(row: AdminStockRow, saved: SavedStockEdit): AdminStockRow {
  return { ...row, ...saved, status: getStockStatus(saved.stock, row.lowStockAlert), investedValueInCents: saved.stock * saved.unitCostInCents, potentialSalesValueInCents: saved.stock * saved.salePriceInCents, potentialProfitInCents: saved.unitCostInCents > 0 ? saved.stock * (saved.salePriceInCents - saved.unitCostInCents) : null };
}
