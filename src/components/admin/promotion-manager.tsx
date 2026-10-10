"use client";
import { useState } from "react";
import Image from "next/image";
import { Plus, Search, X } from "lucide-react";
import { PublicDialog } from "@/components/store/public-dialog";
import { azoresDateTime, promotionPrice, type PromotionState } from "@/lib/promotions";
import { formatPrice } from "@/lib/format";
import type { listPromotions } from "@/lib/promotion-management";
type Data = Awaited<ReturnType<typeof listPromotions>>;
type Row = Data["promotions"][number];
type Draft = { method: "PERCENT" | "FIXED"; amount: string; immediate: boolean; startsAt: string; endsAt: string };
const labels: Record<PromotionState, string> = { ACTIVE: "Ativa", SCHEDULED: "Agendada", EXPIRED: "Terminada", ENDED: "Terminada manualmente", DISABLED: "Desativada" };
const initialDraft = (): Draft => ({ method: "PERCENT", amount: "10", immediate: true, startsAt: azoresDateTime(new Date()), endsAt: "" });
function preview(base: number, draft: Draft) {
  const price = promotionPrice(base, draft.method, Math.round(Number(draft.amount.replace(",", ".")) * 100));
  return price ? `${formatPrice(price)} (−${new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 }).format((1 - price / base) * 100)}%)` : "Preço inválido";
}
const dateLabel = (date: string) => new Intl.DateTimeFormat("pt-PT", { timeZone: "Atlantic/Azores", dateStyle: "short", timeStyle: "short" }).format(new Date(date));
export function PromotionManager({ initial }: { initial: Data }) {
  const [data, setData] = useState(initial); const [search, setSearch] = useState(""); const [filter, setFilter] = useState("ALL");
  const [creating, setCreating] = useState(false); const [selected, setSelected] = useState<string[]>([]); const [draft, setDraft] = useState<Draft>(initialDraft);
  const [editing, setEditing] = useState<string | null>(null); const [deleting, setDeleting] = useState<Row | null>(null); const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [productSearch, setProductSearch] = useState("");
  const counts = [data.promotions.filter(p => p.state === "ACTIVE" && p.price !== null).length, data.promotions.filter(p => p.state === "SCHEDULED").length, data.promotions.filter(p => ["EXPIRED", "ENDED"].includes(p.state)).length];
  async function save(body: unknown, method = "PATCH") {
    setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/admin/promotions", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const next = await res.json(); if (!res.ok) throw new Error(next.error);
      setData(next); setCreating(false); setEditing(null); setDeleting(null); setMessage("Promoção guardada com sucesso.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Não foi possível guardar."); }
    finally { setBusy(false); }
  }
  function beginEdit(p: Row) { setMessage(""); setEditing(p.id); setDraft({ method: p.method, amount: (p.value / 100).toString(), immediate: false, startsAt: azoresDateTime(p.startsAt), endsAt: p.endsAt ? azoresDateTime(p.endsAt) : "" }); }
  const fields = <div className="grid gap-3 sm:grid-cols-2">
    <label>Método<select value={draft.method} onChange={e => setDraft({ ...draft, method: e.target.value as Draft["method"] })}><option value="PERCENT">Percentagem</option><option value="FIXED">Preço promocional fixo</option></select></label>
    <label>{draft.method === "PERCENT" ? "Desconto (%)" : "Preço final (€)"}<input required inputMode="decimal" value={draft.amount} onChange={e => setDraft({ ...draft, amount: e.target.value })} /></label>
    <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" checked={draft.immediate} onChange={e => setDraft({ ...draft, immediate: e.target.checked })} />Começar imediatamente</label>
    {!draft.immediate && <label>Início (Açores)<input type="datetime-local" required value={draft.startsAt} onChange={e => setDraft({ ...draft, startsAt: e.target.value })} /></label>}
    <label>Fim (Açores, opcional)<input type="datetime-local" value={draft.endsAt} onChange={e => setDraft({ ...draft, endsAt: e.target.value })} /></label>
    <p className="text-xs text-slate-500 sm:col-span-2">Sem fim: termine manualmente. Na mudança de hora de outono, a hora repetida corresponde à primeira ocorrência.</p>
  </div>;
  const rows = data.promotions.filter(p => `${p.product.name} ${p.product.brand}`.toLocaleLowerCase("pt-PT").includes(search.toLocaleLowerCase("pt-PT")) && (filter === "ALL" || (filter === "FINISHED" ? ["ENDED", "EXPIRED"].includes(p.state) : p.state === filter)));
  return <div className="promotion-admin space-y-5">
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{["Promoções ativas", "Promoções agendadas", "Promoções terminadas", "Produtos em desconto"].map((title, i) => <button key={title} className="rounded-2xl border border-[color:var(--line)] bg-white p-4 text-left" onClick={() => setFilter(["ACTIVE", "SCHEDULED", "FINISHED", "ACTIVE"][i])}><span className="text-xs text-slate-500">{title}</span><strong className="mt-2 block font-serif text-3xl">{counts[i === 3 ? 0 : i]}</strong></button>)}</div>
    <div className="flex flex-wrap gap-3"><label className="flex min-w-0 flex-1 items-center gap-2"><Search size={18} /><input aria-label="Pesquisar promoções" placeholder="Pesquisar nome ou marca…" value={search} onChange={e => setSearch(e.target.value)} /></label><select aria-label="Estado da promoção" value={filter} onChange={e => setFilter(e.target.value)}><option value="ALL">Todos os estados</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}<option value="FINISHED">Todas as terminadas</option></select><button disabled={busy} className="promo-primary" onClick={() => { setMessage(""); setDraft(initialDraft()); setSelected([]); setProductSearch(""); setCreating(true); }}><Plus size={18} />Criar desconto</button></div>
    {message && <p role="status" className="rounded-xl border bg-white p-3 text-sm">{message}</p>}
    <p className="text-xs text-slate-500">Horas dos Açores · Um registo por produto · Preço base e preços dos decants preservados. O preço público aplica o menor desconto válido, sem acumular.</p>
    <div className="promo-table-header hidden lg:grid"><span>Produto</span><span>Preço / desconto</span><span>Datas / estado</span><span>Ações</span></div>
    {rows.length ? rows.map(p => <article className="promo-row" key={p.id}>
      <div className="flex min-w-0 items-center gap-3"><div className="relative h-16 w-14 shrink-0">{p.product.imageUrl && <Image src={p.product.imageUrl} alt={p.product.name} fill sizes="56px" className="object-contain" />}</div><div className="min-w-0"><strong>{p.product.name}</strong><p className="text-xs text-slate-500">{p.product.brand} · {p.product.sizeLabel}</p>{!p.product.active && <span className="text-xs text-red-600">Produto inativo</span>}</div></div>
      <div><small className="block text-slate-500">Base: {formatPrice(p.product.base)}</small><strong>{p.price ? formatPrice(p.price) : "Desconto não aplicável"}</strong>{p.price && <span className="ml-2 text-xs text-amber-800">−{new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 }).format((1 - p.price / p.product.base) * 100)}%</span>}</div>
      <div className="text-xs"><span className={`inline-block rounded-full px-2 py-1 ${p.state === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{labels[p.state]}</span><p className="mt-1">Início: {dateLabel(p.startsAt)}</p><p>Fim: {p.endsAt ? dateLabel(p.endsAt) : "Sem data"}</p></div>
      <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => beginEdit(p)}>Editar</button><button disabled={busy} onClick={() => save({ id: p.id, version: p.updatedAt, action: p.status === "ENABLED" ? "DISABLE" : "ENABLE" })}>{p.status === "ENABLED" ? "Desativar" : "Ativar"}</button><button disabled={busy || p.status === "ENDED"} onClick={() => save({ id: p.id, version: p.updatedAt, action: "END" })}>Terminar</button><button disabled={busy} onClick={() => { setMessage(""); setDeleting(p); setConfirm(""); }}>Eliminar</button></div>
      {editing === p.id && <form className="col-span-full rounded-xl bg-[#fcf8f2] p-4" onSubmit={e => { e.preventDefault(); void save({ id: p.id, version: p.updatedAt, action: "EDIT", data: draft }); }}>{fields}<p className="my-3 text-sm">Pré-visualização: {preview(p.product.base, draft)}</p><div className="flex gap-2"><button disabled={busy} className="promo-primary">Guardar alterações</button><button type="button" disabled={busy} onClick={() => setEditing(null)}>Cancelar</button></div></form>}
    </article>) : <p className="rounded-2xl border bg-white p-6">Não existem promoções para estes filtros.</p>}
    <PublicDialog open={creating} onClose={() => { if (!busy) setCreating(false); }} title="Criar desconto" className="promo-dialog promotion-admin">
      <button aria-label="Fechar" className="store-icon store-dialog-close" onClick={() => setCreating(false)} disabled={busy}><X /></button>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); void save({ ...draft, productIds: selected }, "POST"); }}>
        <label>Escolher produtos<input placeholder="Pesquisar produto ou marca" value={productSearch} onChange={e => setProductSearch(e.target.value)} /></label>
        <div className="max-h-56 space-y-2 overflow-y-auto">{data.products.filter(p => `${p.name} ${p.brand}`.toLowerCase().includes(productSearch.toLowerCase())).map(p => <label key={p.id} className="flex items-center gap-3 rounded-lg border p-2"><input type="checkbox" checked={selected.includes(p.id)} disabled={data.promotions.some(row => row.productId === p.id)} onChange={e => setSelected(e.target.checked ? [...selected, p.id] : selected.filter(id => id !== p.id))} /><span className="relative h-12 w-10 shrink-0">{p.imageUrl && <Image src={p.imageUrl} alt="" fill sizes="40px" className="object-contain" />}</span><span className="min-w-0 text-sm">{p.name}<small className="block">{p.brand} · {formatPrice(p.base)}</small><small className="block text-amber-800">{selected.includes(p.id) ? `Final: ${preview(p.base, draft)}` : data.promotions.some(row => row.productId === p.id) ? "Edite a promoção existente" : ""}</small></span></label>)}</div>
        {fields}{message && <p role="status" className="text-sm text-amber-900">{message}</p>}<button disabled={busy || !selected.length} className="promo-primary">{busy ? "A guardar…" : "Guardar promoção"}</button>
      </form>
    </PublicDialog>
    <PublicDialog open={!!deleting} onClose={() => { if (!busy) setDeleting(null); }} title="Eliminar promoção" className="promo-dialog promotion-admin"><p className="my-4">Eliminar o registo promocional de {deleting?.product.name}? O produto e o histórico são preservados. Escreva ELIMINAR para confirmar.</p><input aria-label="Confirmação da eliminação" value={confirm} onChange={e => setConfirm(e.target.value)} /><div className="mt-4 flex gap-3"><button onClick={() => setDeleting(null)} disabled={busy}>Cancelar</button><button disabled={busy || confirm !== "ELIMINAR"} onClick={() => deleting && save({ id: deleting.id, version: deleting.updatedAt, action: "DELETE", confirmation: confirm })}>Confirmar eliminação</button></div>{message && <p role="status">{message}</p>}</PublicDialog>
  </div>;
}
