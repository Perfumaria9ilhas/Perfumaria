"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { type AdminStockRow, getStockStatus, getStockStatusTone } from "@/lib/stock";

export type InlineStockDraft = { original: AdminStockRow; size: string; price: string; stock: string };

export function InlineStockRow({ row, draft, onDraft, onSave, onOptions }: {
  row: AdminStockRow; draft?: InlineStockDraft;
  onDraft: (draft: InlineStockDraft | undefined) => void;
  onSave: (row: AdminStockRow) => void; onOptions: () => void;
}) {
  const router = useRouter();
  const lock = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const original = draft?.original ?? row;
  const values = draft ?? { original: row, size: row.sizeLabel || "", price: (row.salePriceInCents / 100).toFixed(2).replace(".", ","), stock: String(row.stock) };
  const dirty = values.size !== (original.sizeLabel || "") || values.price !== (original.salePriceInCents / 100).toFixed(2).replace(".", ",") || values.stock !== String(original.stock);
  const status = getStockStatus(row.stock, row.lowStockAlert);
  function change(field: "size" | "price" | "stock", value: string) {
    setError(""); setSaved(false); onDraft({ ...values, [field]: value });
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (lock.current || !dirty) return;
    const priceText = values.price.trim();
    const price = Number(priceText.replace(",", "."));
    const stock = Number(values.stock);
    if (!/^\d+(?:[,.]\d{1,2})?$/.test(priceText) || !Number.isFinite(price) || !Number.isSafeInteger(Math.round(price * 100)) || price <= 0) { setError("Introduza um preço superior a zero, com até duas casas decimais."); return; }
    if (!/^\d+$/.test(values.stock) || !Number.isSafeInteger(stock)) { setError("O stock deve ser um número inteiro igual ou superior a zero."); return; }
    if (!values.size.trim() || values.size.trim().length > 40 || /^-/.test(values.size.trim())) { setError("Introduza uma capacidade válida, por exemplo 100 ml."); return; }
    let sizeLabel = values.size.trim();
    if (sizeLabel !== (original.sizeLabel || "")) {
      const capacity = sizeLabel.match(/^(\d+(?:[.,]\d+)?)\s*(ml)?$/i);
      if (!capacity || Number(capacity[1].replace(",", ".")) <= 0) { setError("Os mililitros devem ser um número superior a zero, por exemplo 100 ml."); return; }
      sizeLabel = `${capacity[1].replace(",", ".")} ml`;
    }
    lock.current = true; setSaving(true); setError("");
    try {
      const priceInCents = Math.round(price * 100);
      const changedPrice = priceInCents !== original.salePriceInCents;
      const promotion = original.basePriceInCents !== undefined && original.salePriceInCents < original.basePriceInCents;
      // The visible field edits the current bottle sale price. A promotion keeps
      // its original base; raising it past the base explicitly updates both.
      const priceChanges = !changedPrice ? {} : promotion && priceInCents < original.basePriceInCents! ? { salePrice: priceText } : { basePrice: priceText, ...(promotion ? { salePrice: priceText } : {}) };
      const response = await fetch(`/api/admin/stock/product/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock, lowStockAlert: original.lowStockAlert, sizeLabel, version: original.updatedAt, ...priceChanges }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível guardar.");
      const basePriceInCents = "basePrice" in priceChanges ? priceInCents : original.basePriceInCents;
      onSave({ ...row, stock, sizeLabel, salePriceInCents: priceInCents, basePriceInCents, status: getStockStatus(stock, row.lowStockAlert), updatedAt: result.version ?? row.updatedAt, investedValueInCents: stock * row.unitCostInCents, potentialSalesValueInCents: stock * priceInCents, potentialProfitInCents: row.unitCostInCents > 0 ? stock * (priceInCents - row.unitCostInCents) : null });
      onDraft(undefined); setSaved(true); window.dispatchEvent(new Event("admin-alerts-change")); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível guardar."); }
    finally { lock.current = false; setSaving(false); }
  }
  const input = "h-11 w-full min-w-0 rounded-lg border border-[color:var(--line)] bg-white px-2 text-base disabled:opacity-60";
  return <form onSubmit={save} aria-label={`Editar stock: ${row.name}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_36px] gap-x-2 gap-y-3 border-t border-[color:var(--line)] p-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(90px,0.6fr)_36px] lg:items-center">
    <div className="flex min-w-0 items-center gap-3"><Image src={row.imageUrl || "/logo-9-ilhas.svg"} alt={row.name} width={48} height={56} unoptimized className="h-14 w-12 shrink-0 rounded-lg bg-[color:var(--sand-soft)] object-contain" /><div className="min-w-0"><strong className="block text-sm font-medium leading-snug">{row.name}</strong><span className="block text-xs text-slate-500">{row.brandName}</span><span className="hidden text-xs text-slate-500 lg:block">{row.categoryName}</span></div></div>
    <button type="button" disabled={saving} aria-label={`Mais opções: ${row.name}`} onClick={onOptions} className="flex h-11 w-9 items-center justify-center rounded-lg lg:col-start-4 lg:row-start-1"><MoreVertical size={18} /></button>
    <div className="col-span-2 grid min-w-0 grid-cols-3 gap-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
      <label className="min-w-0 space-y-1 text-xs text-slate-600">Mililitros<input aria-label={`Mililitros: ${row.name}`} required maxLength={40} disabled={saving} value={values.size} placeholder="100 ml" onChange={e => change("size", e.target.value)} className={input} /></label>
      <label className="min-w-0 space-y-1 text-xs text-slate-600">Preço (€)<input aria-label={`Preço de venda: ${row.name}`} required inputMode="decimal" disabled={saving} value={values.price} onChange={e => change("price", e.target.value)} className={input} /></label>
      <label className="min-w-0 space-y-1 text-xs text-slate-600">Stock<input aria-label={`Quantidade em stock: ${row.name}`} required inputMode="numeric" disabled={saving} value={values.stock} onChange={e => change("stock", e.target.value)} className={`${input} ${status === "OUT" ? "border-red-300" : status === "LOW" ? "border-amber-300" : ""}`} /></label>
    </div>
    <div className="col-span-2 flex items-center gap-2 text-xs lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:flex-col lg:items-start"><span className="font-semibold">{row.stock} un.</span><span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${getStockStatusTone(status)}`}>{status === "OUT" ? "Esgotado" : status === "LOW" ? "Stock baixo" : "Em stock"}{!row.active ? " · Inativo" : ""}</span></div>
    {(dirty || error || saved) && <div className="col-span-2 min-w-0 lg:col-span-4">{error && <p role="alert" className="mb-2 text-xs text-red-700">{error}</p>}{dirty ? <div className="flex flex-wrap items-center gap-2"><span role="status" className="mr-auto text-xs text-amber-800">Alterações por guardar</span><button type="button" disabled={saving} onClick={() => { onDraft(undefined); setError(""); }} className="min-h-11 rounded-lg border px-3 text-sm disabled:opacity-50">Cancelar</button><button disabled={saving} className="min-h-11 rounded-lg bg-[color:var(--gold)] px-4 text-sm text-white disabled:opacity-50">{saving ? "A guardar…" : "Guardar"}</button></div> : saved ? <p role="status" className="text-xs text-emerald-700">Alterações guardadas.</p> : null}</div>}
  </form>;
}
