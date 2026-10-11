"use client";
import Image from "next/image";
import { MoreVertical } from "lucide-react";
import { type AdminStockRow, getStockStatus, getStockStatusTone } from "@/lib/stock";
import { stockDraft, changedStockFields, type InlineStockDraft, type StockEditField } from "@/lib/stock-edit";
export type { InlineStockDraft } from "@/lib/stock-edit";

export function InlineStockRow({row, draft, onDraft, onOptions, saving, costVisible, onRevealCost, error}: {
  row: AdminStockRow; draft?: InlineStockDraft; onDraft: (draft: InlineStockDraft | undefined) => void; onOptions: () => void;
  saving: boolean; costVisible: boolean; onRevealCost: () => void; error?: string;
}) {
  const values = draft ?? stockDraft(row);
  const changed = changedStockFields(values);
  const status = getStockStatus(row.stock, row.lowStockAlert);
  function change(field: StockEditField, value: string) {
    const next = {...values, [field]: value}; onDraft(changedStockFields(next).length ? next : undefined);
  }
  const input = (field: StockEditField) => `h-11 w-full min-w-0 rounded-lg border bg-white px-2 text-base disabled:opacity-60 ${changed.includes(field) ? "border-amber-400 bg-amber-50" : "border-[color:var(--line)]"}`;
  return <div role="group" aria-label={`Editar stock: ${row.name}`} className={`grid min-w-0 grid-cols-[minmax(0,1fr)_36px] gap-x-2 gap-y-3 border-t border-[color:var(--line)] p-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_minmax(75px,0.4fr)_36px] lg:items-center ${changed.length ? "bg-amber-50/30" : ""}`}>
    <div className="flex min-w-0 items-center gap-3"><Image src={row.imageUrl || "/logo-9-ilhas.svg"} alt={row.name} width={48} height={56} unoptimized className="h-14 w-12 shrink-0 rounded-lg bg-[color:var(--sand-soft)] object-contain"/><div className="min-w-0"><strong className="block text-sm font-medium leading-snug">{row.name}</strong><span className="block text-xs text-slate-500">{row.brandName}</span><span className="hidden text-xs text-slate-500 lg:block">{row.categoryName}</span></div></div>
    <button type="button" disabled={saving} aria-label={`Mais opções: ${row.name}`} onClick={onOptions} className="flex h-11 w-9 items-center justify-center rounded-lg lg:col-start-4 lg:row-start-1"><MoreVertical size={18}/></button>
    <div className="col-span-2 grid min-w-0 grid-cols-3 gap-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:grid-cols-4">
      <label className="min-w-0 space-y-1 text-xs text-slate-600">Mililitros<input aria-label={`Mililitros: ${row.name}`} maxLength={40} disabled={saving} value={values.size} placeholder="100 ml" onChange={e=>change("size",e.target.value)} className={input("size")}/></label>
      <label className="min-w-0 space-y-1 text-xs text-slate-600">Venda (€)<input aria-label={`Preço de venda: ${row.name}`} inputMode="decimal" disabled={saving} value={values.price} onChange={e=>change("price",e.target.value)} className={input("price")}/></label>
      <div className="col-span-3 min-w-0 space-y-1 text-xs text-slate-600 lg:col-span-1 lg:col-start-3 lg:row-start-1"><span>Preço fornecedor (€)</span>{costVisible ? <input aria-label={`Preço fornecedor: ${row.name}`} inputMode="decimal" disabled={saving} value={values.cost} onChange={e=>change("cost",e.target.value)} className={input("cost")}/> : <button type="button" disabled={saving} aria-label={`Ver / Editar preço fornecedor: ${row.name}`} onClick={onRevealCost} className={input("cost") + " text-sm"}>Ver / Editar{changed.includes("cost") ? " · Alterado" : ""}</button>}</div>
      <label className="col-start-3 row-start-1 min-w-0 space-y-1 text-xs text-slate-600 lg:col-start-4">Stock<input aria-label={`Quantidade em stock: ${row.name}`} inputMode="numeric" disabled={saving} value={values.stock} onChange={e=>change("stock",e.target.value)} className={input("stock")}/></label>
    </div>
    <div className="col-span-2 flex items-center gap-2 text-xs lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:flex-col lg:items-start"><span className="font-semibold">{row.stock} un.</span><span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${getStockStatusTone(status)}`}>{status === "OUT" ? "Esgotado" : status === "LOW" ? "Stock baixo" : "Em stock"}{!row.active ? " · Inativo" : ""}</span></div>
    {error && <p role="alert" className="col-span-2 text-xs text-red-700 lg:col-span-4">{error}</p>}
    {changed.length > 0 && <p className="col-span-2 text-xs text-amber-800 lg:col-span-4">Alterações por guardar</p>}
  </div>;
}
