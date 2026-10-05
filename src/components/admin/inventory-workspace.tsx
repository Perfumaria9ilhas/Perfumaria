"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { Check, Clock, Eye, History, MoreVertical, Package, Plus, Search, SlidersHorizontal } from "lucide-react";
import { type AdminStockRow, filterStockRows, getStockStatus, getStockStatusTone, sortStockRows, type StockSortKey } from "@/lib/stock";
import { InventoryDialog } from "./inventory-dialog";

type InventoryFilter = "all" | "in" | "LOW" | "OUT" | "reserve" | "inactive";
type Filters = { query: string; brandId: string; categoryId: string; customerName: string; inventory: InventoryFilter };
const empty: Filters = { query: "", brandId: "", categoryId: "", customerName: "", inventory: "all" };
const options: { value: InventoryFilter; label: string }[] = [
  { value: "all", label: "Todos" }, { value: "in", label: "Em stock" }, { value: "LOW", label: "Stock baixo" },
  { value: "OUT", label: "Esgotados" }, { value: "reserve", label: "Reserva" }, { value: "inactive", label: "Inativos" },
];
const control = "h-10 w-full min-w-0 rounded-xl border border-[color:var(--line)] bg-white px-3 text-sm";
const button = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[color:var(--line)] px-3 text-sm";

export function InventoryWorkspace({ rows, onUpdate, onHistory, onEntry, onNotes, tools, initialStatus }: {
  rows: AdminStockRow[]; onUpdate: (row: AdminStockRow) => void; onHistory: (row: AdminStockRow) => void;
  onEntry: (row: AdminStockRow) => void; onNotes: (row: AdminStockRow) => void; tools: ReactNode; initialStatus: "all" | "LOW";
}) {
  const [filters, setFilters] = useState<Filters>({ ...empty, inventory: initialStatus });
  const [draftFilters, setDraftFilters] = useState<Filters | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [quick, setQuick] = useState<AdminStockRow | null>(null);
  const [historyPicker, setHistoryPicker] = useState(false);
  const [actions, setActions] = useState<AdminStockRow | null>(null);
  const [stock, setStock] = useState(0);
  const [alert, setAlert] = useState(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sort, setSort] = useState<{ key: StockSortKey; direction: "asc" | "desc" }>({ key: "product", direction: "asc" });
  const query = useDeferredValue(filters.query);
  const filtered = useMemo(() => sortStockRows(filterStockRows(rows, {
    ...filters, query, status: filters.inventory === "LOW" || filters.inventory === "OUT" ? filters.inventory : "all",
    missingCostOnly: false, zeroStockOnly: false,
  }), sort.key, sort.direction), [rows, filters, query, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const brands = useMemo(() => [...new Map(rows.map((r) => [r.brandId, r.brandName])).entries()].sort((a, b) => a[1].localeCompare(b[1], "pt")), [rows]);
  const categories = useMemo(() => [...new Map(rows.map((r) => [r.categoryId, r.categoryName])).entries()].sort((a, b) => a[1].localeCompare(b[1], "pt")), [rows]);
  const customers = useMemo(() => [...new Set(rows.flatMap((r) => r.customerNames))].sort((a, b) => a.localeCompare(b, "pt")), [rows]);
  const counts = useMemo(() => ({ all: rows.length, in: rows.filter((r) => r.stock > 0).length, LOW: rows.filter((r) => getStockStatus(r.stock, r.lowStockAlert) === "LOW").length, OUT: rows.filter((r) => r.stock === 0).length, reserve: rows.filter((r) => r.active && r.stock === 0).length }), [rows]);
  function change(next: Partial<Filters>) { setFilters((f) => ({ ...f, ...next })); setPage(1); }
  function openQuick(row: AdminStockRow) { setActions(null); setStock(row.stock); setAlert(row.lowStockAlert); setActive(row.active); setError(""); setQuick(row); }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!quick) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/admin/stock/product/${quick.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock, lowStockAlert: alert, active }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Não foi possível guardar.");
      onUpdate({ ...quick, stock, lowStockAlert: alert, active, status: getStockStatus(stock, alert) });
      setQuick(null); setMessage(payload.unchanged ? "Sem alterações. Os dados foram preservados." : "Stock atualizado.");
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível guardar."); }
    finally { setSaving(false); }
  }
  function exportFiltered() {
    const params = new URLSearchParams({ scope: "filtered", ...filters, status: filters.inventory === "LOW" || filters.inventory === "OUT" ? filters.inventory : "all" });
    window.location.href = `/api/admin/stock/export?${params}`;
  }
  function advanced(values: Filters, update: (next: Partial<Filters>) => void) {
    return <>
      <label className="block space-y-1 text-xs text-slate-600">Marca<select aria-label="Marca" value={values.brandId} onChange={(e) => update({ brandId: e.target.value })} className={control}><option value="">Todas as marcas</option>{brands.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label className="block space-y-1 text-xs text-slate-600">Categoria<select aria-label="Categoria" value={values.categoryId} onChange={(e) => update({ categoryId: e.target.value })} className={control}><option value="">Todas as categorias</option>{categories.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label className="block space-y-1 text-xs text-slate-600">Estado<select aria-label="Estado" value={values.inventory} onChange={(e) => update({ inventory: e.target.value as InventoryFilter })} className={control}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
    </>;
  }
  function header(label: string, key: StockSortKey, width: string) {
    return <th className={width + " p-3"} aria-sort={sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}><button type="button" onClick={() => { setSort({ key, direction: sort.key === key && sort.direction === "asc" ? "desc" : "asc" }); setPage(1); }} className="min-h-8 text-left">{label}{sort.key === key ? (sort.direction === "asc" ? " ↑" : " ↓") : ""}</button></th>;
  }
  function product(row: AdminStockRow) {
    return <button type="button" onClick={() => openQuick(row)} className="flex min-w-0 items-center gap-3 text-left" aria-label={`Edição rápida: ${row.name}`}>
      <Image src={row.imageUrl || "/logo-9-ilhas.svg"} alt="" width={48} height={56} unoptimized className="h-14 w-12 shrink-0 rounded-lg bg-[color:var(--sand-soft)] object-contain" />
      <span className="min-w-0"><strong className="block text-sm font-medium leading-snug">{row.name}</strong><span className="text-xs text-slate-500">{row.sizeLabel || "—"}<span className="lg:hidden"> · {row.brandName}</span></span></span>
    </button>;
  }
  function badge(row: AdminStockRow) {
    const status = getStockStatus(row.stock, row.lowStockAlert);
    return <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${getStockStatusTone(status)}`}>{status === "OUT" ? "Esgotado" : status === "LOW" ? "Stock baixo" : "Em stock"}{!row.active ? " · Inativo" : ""}</span>;
  }
  return <div className="space-y-4">
    <div className="flex justify-end"><Link href="/admin/produtos?novo=1#novo-produto" className={`${button} bg-[color:var(--atlantic)] text-white`}><Plus size={16} />Novo produto</Link></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      {([ ["all", "Total de produtos", Package], ["in", "Em stock", Check], ["LOW", "Stock baixo", Clock], ["OUT", "Esgotados", Package], ["reserve", "Disponíveis por reserva", Eye] ] as const).map(([value, label, Icon]) => <button type="button" key={value} aria-pressed={filters.inventory === value} onClick={() => change({ inventory: value })} className={`flex items-center gap-3 rounded-2xl border p-3 text-left ${filters.inventory === value ? "border-[color:var(--atlantic)] bg-[color:var(--sand-soft)]" : "border-[color:var(--line)] bg-white"}`}><Icon size={20} className="shrink-0 text-[color:var(--atlantic)]" /><span className="min-w-0"><span className="block text-[11px] text-slate-600">{label}</span><strong className="font-serif text-2xl">{counts[value]}</strong></span></button>)}
    </div>
    <section className="min-w-0 rounded-2xl border border-[color:var(--line)] bg-white">
      <div className="space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap gap-1.5" aria-label="Filtros rápidos">{options.map((o) => <button key={o.value} type="button" aria-pressed={filters.inventory === o.value} onClick={() => change({ inventory: o.value })} className={`min-h-9 rounded-xl px-3 text-xs ${filters.inventory === o.value ? "bg-[color:var(--atlantic)] text-white" : "border border-[color:var(--line)] bg-[color:var(--sand-soft)]"}`}>{o.label}</button>)}</div>
        <div className="grid min-w-0 grid-cols-[1fr_40px] items-end gap-2 lg:grid-cols-[minmax(170px,2fr)_1fr_1fr_1fr_auto]">
          <label className="relative block min-w-0"><span className="sr-only">Pesquisar produto</span><Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" /><input type="search" value={filters.query} onChange={(e) => change({ query: e.target.value })} placeholder="Pesquisar produto..." className={`${control} pl-9`} /></label>
          <button type="button" aria-label="Abrir filtros" onClick={() => setDraftFilters({ ...filters })} className={`${button} px-0 lg:hidden`}><SlidersHorizontal size={18} /></button>
          <div className="hidden lg:contents">{advanced(filters, change)}</div>
          <div className="hidden items-center gap-2 lg:flex"><button type="button" aria-label="Mais filtros" onClick={() => setDraftFilters({ ...filters })} className={button}><SlidersHorizontal size={16} /></button><button type="button" onClick={() => { setFilters(empty); setPage(1); }} className="min-h-10 text-xs text-[color:var(--atlantic)] underline">Limpar filtros</button></div>
        </div>
      </div>
      {message ? <p role="status" className="mx-3 mb-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">{message}</p> : null}
      <div className="hidden lg:block"><table className="w-full table-fixed text-left text-sm"><thead className="border-y border-[color:var(--line)] bg-[color:var(--sand-soft)] text-xs text-slate-600"><tr>{header("Produto", "product", "w-[32%]")}{header("Marca", "brand", "w-[16%]")}{header("Categoria", "category", "w-[13%]")}{header("Stock", "stock", "w-[7%]")}{header("Estado", "status", "w-[16%]")}<th className="p-3">Ações</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id} className="border-b border-[color:var(--line)]"><td className="p-3">{product(row)}</td><td className="break-words p-3 text-xs text-slate-600">{row.brandName}</td><td className="break-words p-3 text-xs text-slate-600">{row.categoryName}</td><td className="p-3 font-semibold">{row.stock}</td><td className="p-3">{badge(row)}</td><td className="p-2"><div className="flex gap-1"><button type="button" onClick={() => openQuick(row)} className={`${button} text-xs`}>Editar</button><button type="button" aria-label={`Mais opções: ${row.name}`} onClick={() => setActions(row)} className={`${button} px-2`}><MoreVertical size={16} /></button></div></td></tr>)}</tbody></table></div>
      <div className="lg:hidden">{visible.map((row) => <div key={row.id} className="flex items-center gap-2 border-t border-[color:var(--line)] p-3"><div className="min-w-0 flex-1">{product(row)}<div className="mt-1 flex items-center gap-2 pl-[60px]"><span className="text-xs font-semibold">{row.stock} un.</span>{badge(row)}</div></div><button type="button" aria-label={`Mais opções: ${row.name}`} onClick={() => setActions(row)} className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg"><MoreVertical size={18} /></button></div>)}</div>
      {!visible.length ? <p className="p-8 text-center text-sm text-slate-500">Nenhum produto encontrado. Limpe os filtros para ver todo o inventário.</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line)] p-3 text-xs text-slate-600"><span>{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} produtos</span><div className="flex items-center gap-2"><button type="button" aria-label="Página anterior" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className={`${button} disabled:opacity-40`}>‹</button><span>{currentPage}/{totalPages}</span><button type="button" aria-label="Página seguinte" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages} className={`${button} disabled:opacity-40`}>›</button></div><select aria-label="Produtos por página" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-9 rounded-lg border px-2"><option value={20}>20 por página</option><option value={50}>50 por página</option><option value={100}>100 por página</option></select></div>
    </section>
    <details className="rounded-2xl border border-[color:var(--line)] bg-white p-4"><summary className="cursor-pointer text-sm font-semibold">Importar / Exportar e mais opções</summary><div className="mt-3 space-y-3"><button type="button" onClick={exportFiltered} className={button}>Exportar produtos filtrados</button>{tools}</div></details>
    <div className="flex flex-wrap gap-2"><Link href="/admin/produtos" className={button}>Gerir produtos e preferidos</Link><button type="button" className={button} onClick={() => setHistoryPicker(true)}><History size={16} />Histórico de stock</button></div>
    {historyPicker ? <InventoryDialog title="Histórico de stock" onClose={() => setHistoryPicker(false)}><label className="block space-y-2 text-sm">Selecionar produto<select className={control} defaultValue="" onChange={(e) => { const row = rows.find((r) => r.id === e.target.value); if (row) { setHistoryPicker(false); onHistory(row); } }}><option value="">Selecionar produto...</option>{rows.map((r) => <option key={r.id} value={r.id}>{r.name} · {r.brandName}</option>)}</select></label></InventoryDialog> : null}
    {draftFilters ? <InventoryDialog title="Filtros" onClose={() => setDraftFilters(null)}><div className="space-y-4"><label className="block space-y-1 text-xs text-slate-600">Pesquisar<input type="search" value={draftFilters.query} onChange={(e) => setDraftFilters({ ...draftFilters, query: e.target.value })} className={control} placeholder="Nome, marca ou categoria..." /></label>{advanced(draftFilters, (next) => setDraftFilters({ ...draftFilters, ...next }))}<label className="block space-y-1 text-xs text-slate-600">Cliente<select aria-label="Cliente" value={draftFilters.customerName} onChange={(e) => setDraftFilters({ ...draftFilters, customerName: e.target.value })} className={control}><option value="">Todos os clientes</option>{customers.map((name) => <option key={name}>{name}</option>)}</select></label><button type="button" onClick={() => { setFilters(draftFilters); setPage(1); setDraftFilters(null); }} className={`${button} w-full bg-[color:var(--atlantic)] text-white`}>Aplicar filtros</button><button type="button" onClick={() => { setDraftFilters(empty); setFilters(empty); setPage(1); }} className={`${button} w-full`}>Limpar filtros</button></div></InventoryDialog> : null}
    {quick ? <InventoryDialog title={`Edição rápida · ${quick.name}`} onClose={() => { if (!saving) setQuick(null); }}><form onSubmit={save} className="space-y-4"><p className="text-xs text-slate-500">{quick.brandName} · {quick.sizeLabel}. O estado de stock é calculado automaticamente pela quantidade e pelo limite de alerta.</p><label className="block space-y-1 text-sm">Stock<input type="number" min={0} required value={stock} onChange={(e) => setStock(Number(e.target.value))} className={control} /></label><label className="block space-y-1 text-sm">Limite de stock baixo<input type="number" min={0} required value={alert} onChange={(e) => setAlert(Number(e.target.value))} className={control} /></label><label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />Produto ativo</label>{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}<div className="flex gap-2"><button type="button" disabled={saving} onClick={() => setQuick(null)} className={`${button} flex-1`}>Cancelar</button><button disabled={saving} className={`${button} flex-1 bg-[color:var(--atlantic)] text-white`}>{saving ? "A guardar..." : "Guardar"}</button></div><Link href={`/admin/produtos?editar=${quick.id}#editar-produto`} className="block text-center text-sm underline">Edição completa do produto</Link></form></InventoryDialog> : null}
    {actions ? <InventoryDialog title={actions.name} onClose={() => setActions(null)}><div className="grid gap-2"><button type="button" className={button} onClick={() => openQuick(actions)}>Edição rápida</button><Link className={button} href={`/admin/produtos?editar=${actions.id}#editar-produto`}>Editar produto completo</Link><button type="button" className={button} onClick={() => { onHistory(actions); setActions(null); }}>Histórico de stock</button><button type="button" className={button} onClick={() => { onEntry(actions); setActions(null); }}>Registar entrada</button><button type="button" className={button} onClick={() => { onNotes(actions); setActions(null); }}>Notas internas</button></div></InventoryDialog> : null}
  </div>;
}
