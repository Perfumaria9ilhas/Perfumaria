"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { InventoryDialog } from "./inventory-dialog";
import { type AdminStockRow, getStockStatus } from "@/lib/stock";
import { formatPrice } from "@/lib/format";

export function QuickStockEditor({ row, onClose, onSave }: { row: AdminStockRow; onClose: () => void; onSave: (row: AdminStockRow) => void }) {
  const router = useRouter();
  const [stock, setStock] = useState(row.stock);
  const [price, setPrice] = useState(((row.basePriceInCents ?? row.salePriceInCents) / 100).toFixed(2));
  const [size, setSize] = useState(row.sizeLabel || "100 ml");
  const hasPromotion = row.basePriceInCents !== undefined && row.salePriceInCents < row.basePriceInCents;
  const [promotionPrice, setPromotionPrice] = useState((row.salePriceInCents / 100).toFixed(2));
  const [cost, setCost] = useState((row.unitCostInCents / 100).toFixed(2));
  const [alert, setAlert] = useState(row.lowStockAlert);
  const [active, setActive] = useState(row.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const control = "h-11 w-full min-w-0 rounded-xl border border-[color:var(--line)] bg-white px-3 text-base";
  const button = "flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm disabled:opacity-50";
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setSaving(true); setError("");
    try {
      const response = await fetch(`/api/admin/stock/product/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock, basePrice: price, sizeLabel: size, lowStockAlert: alert, unitCost: cost, active, ...(hasPromotion && Math.round(Number(promotionPrice) * 100) !== row.salePriceInCents ? { salePrice: promotionPrice } : {}), version: row.updatedAt }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Não foi possível guardar.");
      const basePriceInCents = Math.round(Number(price.replace(",", ".")) * 100);
      const unitCostInCents = Math.round(Number(cost.replace(",", ".")) * 100);
      // A bottle promotion retains its own price. Never overwrite decant pricing.
      const salePriceInCents = row.salePriceInCents === (row.basePriceInCents ?? row.salePriceInCents) ? basePriceInCents : Math.min(basePriceInCents, Math.round(Number(promotionPrice) * 100));
      onSave({ ...row, stock, basePriceInCents, salePriceInCents, sizeLabel: size, unitCostInCents, lowStockAlert: alert, active, status: getStockStatus(stock, alert), updatedAt: result.version ?? row.updatedAt, investedValueInCents: stock * unitCostInCents, potentialSalesValueInCents: stock * salePriceInCents, potentialProfitInCents: unitCostInCents > 0 ? stock * (salePriceInCents - unitCostInCents) : null });
      window.dispatchEvent(new Event("admin-alerts-change")); router.refresh(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível guardar."); }
    finally { lock.current = false; setSaving(false); }
  }
  return <InventoryDialog title="Editar rapidamente" onClose={() => { if (!lock.current) onClose(); }}>
    <div className="mb-4 flex items-center gap-3"><Image src={row.imageUrl || "/logo-9-ilhas.svg"} alt="" width={48} height={64} unoptimized className="h-16 w-12 object-contain" /><div><strong className="block">{row.name}</strong><span className="text-xs text-slate-500">{row.brandName} · Frasco</span></div></div>
    <form onSubmit={save} className="space-y-4">
      <div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-xs">Capacidade do frasco<input required maxLength={40} value={size} onChange={e => setSize(e.target.value)} className={control} placeholder="100 ml" /></label><label className="space-y-1 text-xs">Preço base (€)<input required type="number" min="0.01" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className={control} /></label></div>
      {row.salePriceInCents !== row.basePriceInCents ? <p className="text-xs text-slate-500">Preço promocional atual: {formatPrice(row.salePriceInCents)}. Pode editar a promoção em «Custo, alertas e disponibilidade».</p> : null}
      <label className="block space-y-1 text-xs">Stock de frascos<div className="grid grid-cols-[44px_minmax(0,1fr)_44px] gap-2"><button type="button" aria-label="Diminuir stock" disabled={saving || stock === 0} onClick={() => setStock(Math.max(0, stock - 1))} className={button}><Minus size={16} /></button><input aria-label="Stock de frascos" required type="number" min={0} step={1} value={stock} onChange={e => setStock(Number(e.target.value))} className={control + " text-center"} /><button type="button" aria-label="Aumentar stock" disabled={saving} onClick={() => setStock(stock + 1)} className={button}><Plus size={16} /></button></div></label>
      <details className="rounded-xl border p-3"><summary className="cursor-pointer text-sm">Custo, alertas e disponibilidade</summary><div className="mt-3 space-y-3">{hasPromotion ? <label className="block text-xs">Preço promocional (€)<input required type="number" min="0.01" step="0.01" value={promotionPrice} onChange={e => setPromotionPrice(e.target.value)} className={control} /></label> : null}<label className="block text-xs">Custo de compra (€)<input required type="number" min={0} step="0.01" value={cost} onChange={e => setCost(e.target.value)} className={control} /></label><label className="block text-xs">Limite de stock baixo<input required type="number" min={0} step={1} value={alert} onChange={e => setAlert(Number(e.target.value))} className={control} /></label><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />Produto ativo</label></div></details>
      <p className="text-xs text-slate-500">Os decants mantêm as regras atuais. Uma capacidade com vendas anteriores fica protegida.</p>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <div className="grid grid-cols-2 gap-2"><button type="button" disabled={saving} onClick={onClose} className={button}>Cancelar</button><button disabled={saving} className={button + " bg-[color:var(--gold)] text-white"}>{saving ? "A guardar…" : "Guardar"}</button></div>
      <Link href={`/admin/produtos?editar=${row.id}#editar-produto`} className="block text-center text-xs underline">Edição completa do produto</Link>
    </form>
  </InventoryDialog>;
}
