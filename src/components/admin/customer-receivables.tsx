"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { SaleAccountView } from "@/lib/sale-accounts";
import { groupCustomerPendencies } from "@/lib/customer-pendencies";
import { formatPrice } from "@/lib/format";
import { getAzoresDateKey, getAzoresDateStart } from "@/lib/date";

const field = "min-h-11 min-w-0 w-full rounded-xl border border-[color:var(--line)] bg-white px-3 text-sm";
const button = "min-h-11 rounded-xl border border-[color:var(--line)] px-3 py-2 text-sm disabled:opacity-50";
const dateLabel = (value: string) => new Date(value).toLocaleString("pt-PT", { timeZone: "Atlantic/Azores", dateStyle: "short", timeStyle: "short" });
const methods: Record<string, string> = { CASH: "Dinheiro", MBWAY: "MB Way", TRANSFER: "Transferência", CARD: "Cartão" };
type Filter = "pending" | "unpaid" | "delivery" | "complete" | "all" | "old";
type Command = { kind: "PAYMENT" | "REVERSAL" | "DELIVERY" | "OPENING_CORRECTION"; amount?: number; movementId?: string; delivered?: number; method?: string; reversesId?: string; reason?: string; occurredAt?: string };

export function CustomerReceivables({ dashboard = false, renderEditor }: { dashboard?: boolean; renderEditor?: (id: string, version: string) => ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [sales, setSales] = useState<SaleAccountView[] | null>(null);
  const [filter, setFilter] = useState<Filter>(params.get("sale") ? "all" : params.get("payment") === "pending" ? "unpaid" : params.get("delivery") === "pending" ? "delivery" : params.get("payment") === "paid" ? "complete" : "pending");
  const [query, setQuery] = useState(params.get("sale") ?? "");
  const [sort, setSort] = useState("oldest");
  const [from, setFrom] = useState(() => !dashboard && params.get("period") === "today" ? getAzoresDateKey() : !dashboard && params.get("period") === "month" ? `${getAzoresDateKey().slice(0,7)}-01` : ""); const [to, setTo] = useState(() => !dashboard && ["today","month"].includes(params.get("period")??"") ? getAzoresDateKey() : "");
  const [kind, setKind] = useState("all");
  const [open, setOpen] = useState<string[]>([]);
  const [full, setFull] = useState<string[]>([]);
  const [payment, setPayment] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const pending = useRef<{ signature: string; id: string } | null>(null);
  const inFlight = useRef(false);
  const load = useCallback(async () => {
    const res = await fetch("/api/admin/stock/sales/accounts", { cache: "no-store" });
    if (!res.ok) throw new Error("Não foi possível atualizar as pendências.");
    setSales((await res.json()).sales); setNow(Date.now());
  }, []);
  useEffect(() => {
    const refresh = () => { if (!document.hidden) load().catch(e => setError(e.message)); };
    refresh(); const timer = setInterval(refresh, 20_000);
    window.addEventListener("focus", refresh); window.addEventListener("sales-accounts-change", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); window.removeEventListener("sales-accounts-change", refresh); };
  }, [load]);
  async function mutate(sale: SaleAccountView, command: Command) {
    if (inFlight.current) return false;
    inFlight.current = true; setBusy(true); setError(""); setMessage("");
    // Retain the request ID after a network error: retry cannot create a second payment.
    const signature = JSON.stringify({ saleId: sale.id, ...command });
    if (pending.current?.signature !== signature) pending.current = { signature, id: crypto.randomUUID() };
    try {
      const res = await fetch("/api/admin/stock/sales/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...command, saleId: sale.id, version: sale.version, requestId: pending.current.id }) });
      const result = await res.json();
      if (!res.ok) { if (res.status === 409) { pending.current = null; setPayment(null); await load(); } throw new Error(result.error); }
      pending.current = null;
      await load(); setMessage("Alteração registada com sucesso.");
      window.dispatchEvent(new Event("admin-alerts-change")); window.dispatchEvent(new Event("sales-accounts-change")); router.refresh();
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível confirmar a gravação. Tente novamente."); return false; }
    finally { inFlight.current = false; setBusy(false); }
  }
  const customers = groupCustomerPendencies(sales ?? [], now);
  const stats = [
    { label: "Total por receber", value: formatPrice(customers.reduce((n, c) => n + c.outstanding, 0)), filter: "unpaid" },
    { label: "Clientes devedores", value: String(customers.filter(c => c.outstanding > 0).length), filter: "unpaid" },
    { label: "Produtos por entregar", value: String(customers.reduce((n, c) => n + c.undelivered, 0)), filter: "delivery" },
    { label: "Pendências > 7 dias", value: String((sales ?? []).filter(s => (s.outstanding || s.undelivered) && now - Date.parse(s.createdAt) > 7 * 86400000).length), filter: "old" },
  ] as const;
  const matches = (sale: SaleAccountView) => {
    if (filter === "pending" && !sale.outstanding && !sale.undelivered || filter === "unpaid" && !sale.outstanding || filter === "delivery" && !sale.undelivered || filter === "complete" && (sale.outstanding || sale.undelivered)) return false;
    if (filter === "old" && ((!sale.outstanding && !sale.undelivered) || now - Date.parse(sale.createdAt) <= 7 * 86400000)) return false;
    const day = getAzoresDateKey(new Date(sale.createdAt));
    if (from && day < from || to && day > to) return false;
    if (kind !== "all" && !sale.items.some(i => kind === "bottle" ? !/decant/i.test(i.notes ?? "") : kind === "kit" ? /kit de decants/i.test(i.notes ?? "") : /decant individual/i.test(i.notes ?? "") && (kind === "10" ? /10\s*ml/i.test(i.notes ?? "") : !/10\s*ml/i.test(i.notes ?? "")))) return false;
    return `${sale.customerName} ${sale.id} ${sale.items.map(i => i.name).join(" ")}`.toLocaleLowerCase("pt").includes(query.trim().toLocaleLowerCase("pt"));
  };
  // Include completed customers only in the sales history, never in Dashboard pendencies.
  const groups = new Map<string, { name: string; sales: SaleAccountView[] }>();
  for (const sale of (sales ?? []).filter(matches)) {
    if (dashboard && !sale.outstanding && !sale.undelivered) continue;
    const key = sale.customerName.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt");
    const group = groups.get(key) ?? { name: sale.customerName, sales: [] }; group.sales.push(sale); groups.set(key, group);
  }
  const debt = (group: {sales: SaleAccountView[]}) => group.sales.filter(s=>s.outstanding>0);
  const sorted = [...groups.entries()].sort(([,a],[,b]) => sort === "amount" ? b.sales.reduce((n,s)=>n+s.outstanding,0)-a.sales.reduce((n,s)=>n+s.outstanding,0) : Number(debt(b).length>0)-Number(debt(a).length>0) || (debt(a)[0]?.createdAt ?? a.sales[0].createdAt).localeCompare(debt(b)[0]?.createdAt ?? b.sales[0].createdAt));
  return <section className="min-w-0 space-y-4" aria-label="Pendências de clientes">
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">{stats.map(s => <button key={s.label} onClick={() => setFilter(s.filter)} aria-pressed={filter === s.filter} className="min-w-0 rounded-2xl border border-[color:var(--line)] bg-white p-3 text-left"><span className="text-xs text-slate-600">{s.label}</span><strong className="mt-1 block break-words font-serif text-xl">{sales ? s.value : "…"}</strong></button>)}</div>
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-serif text-2xl">{dashboard ? "Pendências de clientes" : "Estado das vendas"}</h2><button className={button} onClick={() => load().catch(e => setError(e.message))}>Atualizar</button></div>
    <p className="text-xs text-slate-500">Agrupado pelo nome registado. Pessoas com o mesmo nome podem aparecer juntas. Os saldos de cada venda permanecem separados. Horas dos Açores.</p>
    {message ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
    <input aria-label="Pesquisar vendas" placeholder="Pesquisar cliente, produto ou identificador da venda" value={query} onChange={e => setQuery(e.target.value)} className={field} />
    <div className="flex flex-wrap gap-2">{([ ["pending","Pendentes"], ["unpaid","Por pagar"], ["delivery","Por entregar"], ...(!dashboard ? [["complete","Concluídas"],["all","Todas"]] : []) ] as [Filter,string][]).map(([key,label]) => <button key={key} onClick={() => setFilter(key)} aria-pressed={filter===key} className={`${button} ${filter===key ? "bg-[color:var(--gold)] text-white" : "bg-white"}`}>{label}</button>)}</div>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4"><select aria-label="Ordenação" className={field} value={sort} onChange={e => setSort(e.target.value)}><option value="oldest">Pendências mais antigas</option><option value="amount">Maior dívida</option></select>{!dashboard ? <><label className="text-xs">Desde<input type="date" aria-label="Desde" className={field} value={from} onChange={e => setFrom(e.target.value)} /></label><label className="text-xs">Até<input type="date" aria-label="Até" className={field} value={to} onChange={e => setTo(e.target.value)} /></label><select aria-label="Formato" className={field} value={kind} onChange={e => setKind(e.target.value)}><option value="all">Todos os formatos</option><option value="bottle">Frascos</option><option value="kit">Kits</option><option value="5">Decants 5 ml</option><option value="10">Decants 10 ml</option></select><button className={button} onClick={() => {setFrom("");setTo("");setKind("all");setQuery("");setFilter("all");}}>Limpar filtros</button></> : null}</div>
    {sales && !sorted.length ? <p className="rounded-2xl border bg-white p-4">Nenhuma venda neste filtro.</p> : null}
    {sorted.map(([key, customer]) => {
      const debt = customer.sales.reduce((n,s) => n+s.outstanding,0); const delivery = customer.sales.reduce((n,s) => n+s.undelivered,0);
      const unpaid = customer.sales.reduce((n,s) => n+(s.outstanding ? s.items.filter(i=>i.outstanding).reduce((n,i)=>n+i.quantity,0):0),0);
      return <article key={key} className="min-w-0 rounded-2xl border border-[color:var(--line)] bg-white">
        <button aria-expanded={open.includes(key)} onClick={() => setOpen(v => v.includes(key) ? v.filter(k=>k!==key):[...v,key])} className="flex min-h-20 w-full min-w-0 items-center justify-between gap-3 p-4 text-left"><span className="min-w-0"><strong className="block break-words">{customer.name}</strong><span className="block text-xs text-slate-500">{unpaid} un. com pagamento pendente · {delivery} un. por entregar</span><span className="block text-xs text-slate-500">Mais antiga: {dateLabel(customer.sales[0].createdAt)}</span></span><span className="shrink-0 text-right"><strong>{formatPrice(debt)}</strong><span className="block text-xs">por receber {open.includes(key) ? "⌃":"⌄"}</span></span></button>
        {open.includes(key) ? <div className="space-y-3 border-t p-3">{customer.sales.map(sale => {
          const expanded = full.includes(sale.id);
          const items = sale.items.filter(i=>expanded || filter === "all" || filter === "complete" || i.undelivered>0 || sale.outstanding>0 && i.outstanding>0);
          const reversed = new Set(sale.history.map(e=>e.reversesId));
          return <section key={sale.id} className="min-w-0 space-y-3 rounded-xl bg-[color:var(--sand-soft)] p-3" aria-label={`Venda ${sale.id}`}>
            <div className="flex flex-wrap justify-between gap-2 text-xs"><span className="min-w-0 break-all">Venda {sale.id} · {dateLabel(sale.createdAt)}</span><strong>{formatPrice(sale.outstanding)} por receber</strong></div>
            <p className="text-xs">Vendido: {formatPrice(sale.total)} · Recebido: {formatPrice(sale.received)}</p>
            {sale.unallocated>0 ? <p className="text-xs text-amber-800">{formatPrice(sale.unallocated)} recebidos ao nível da venda, sem atribuição a produtos. Não se marcou nenhum produto arbitrariamente como pago.</p>:null}
            {items.map(item=><div key={item.id} className="min-w-0 rounded-xl border bg-white p-3"><div className="flex min-w-0 gap-3"><Image src={item.imageUrl || "/logo-9-ilhas.svg"} alt="" width={32} height={44} unoptimized className="h-11 w-8 shrink-0 object-contain"/><div className="min-w-0 flex-1"><strong className="block break-words text-sm">{item.quantity}× {item.name}</strong><p className="text-xs">{item.offered ? "Oferecido" : !sale.outstanding ? "Sem dívida nesta venda" : item.outstanding ? `${formatPrice(item.outstanding)} de saldo do artigo${sale.unallocated>0 ? " antes do valor não atribuído":""}` : "Pago"} · {item.undelivered ? `${item.undelivered} un. por entregar`:"Entregue"}</p>{item.notes?.includes("Decant") || /kit de decants/i.test(item.notes??"") ? <p className="text-xs">{item.notes?.split("[pedido:")[0].split("[kit:")[0]}</p>:null}</div></div>
              <button disabled={busy} className="mt-2 text-xs underline" onClick={()=>{const raw=window.prompt("Corre\u00e7\u00e3o do estado anterior, em euros (negativo para retirar valor incorretamente pago; positivo para repor). N\u00e3o regista recebimentos.");if(!raw)return;const value=raw.trim().replace(",",".");if(!/^-?\d+(\.\d{1,2})?$/.test(value)||!Number(value)){setError("Valor de corre\u00e7\u00e3o inv\u00e1lido.");return;}const reason=window.prompt("Motivo da corre\u00e7\u00e3o do estado anterior:")?.trim();if(reason)void mutate(sale,{kind:"OPENING_CORRECTION",movementId:item.id,amount:Math.round(Number(value)*100),reason});}}>Corrigir estado de pagamento antigo</button>
              <DeliveryControl key={`${item.id}:${sale.version}`} item={item} busy={busy} onSave={(delivered,reason)=>mutate(sale,{kind:"DELIVERY",movementId:item.id,delivered,reason})}/>
            </div>)}
            <div className="flex flex-wrap gap-2">{sale.outstanding>0 ? <button disabled={busy} className={`${button} bg-[color:var(--gold)] text-white`} onClick={()=>setPayment(payment===sale.id?null:sale.id)}>Registar pagamento</button>:null}<button className={button} onClick={()=>setFull(v=>expanded?v.filter(id=>id!==sale.id):[...v,sale.id])}>{expanded?"Só pendências":"Consultar venda completa"}</button></div>
            {payment===sale.id ? <PaymentForm key={sale.id} sale={sale} sales={customer.sales} onSaleChange={setPayment} busy={busy} onCancel={()=>setPayment(null)} onSubmit={async (command,version)=>{if(await mutate({...sale,version},command))setPayment(null);}}/>:null}
            <details><summary className="cursor-pointer py-2 text-sm">Histórico de pagamentos e entregas</summary><div className="space-y-2 text-xs">{sale.openingReceived>0 ? <p>Estado anterior: {formatPrice(sale.openingReceived)} pagos. Sem data ou método de recebimento disponíveis; não foi criado um pagamento histórico.</p>:null}{!sale.history.length?<p>Sem novos movimentos.</p>:null}{sale.legacyHistory.length ? <details><summary className="cursor-pointer py-2">Registos anteriores de estado (não são recibos)</summary>{sale.legacyHistory.map((e,index)=><p className="break-words py-2" key={index}>{dateLabel(e.date)} · {e.notes}</p>)}</details> : null}{sale.history.map(event=><div key={event.id} className="rounded-xl border bg-white p-3"><p><strong>{event.kind==="PAYMENT"?"Pagamento":event.kind==="REVERSAL"?"Anulação de pagamento":event.kind==="OPENING_CORRECTION"?"Correção de saldo antigo (sem recebimento)":"Entrega / correção"}</strong> · {event.kind==="DELIVERY"?`${event.delivered} un. entregues`:formatPrice(event.amount)} {event.method?`· ${methods[event.method]}`:""}</p><p>{dateLabel(event.occurredAt)} · {event.actorName}</p>{event.movementId?<p>{sale.items.find(i=>i.id===event.movementId)?.name}</p>:null}{event.reason?<p>Motivo: {event.reason}</p>:null}{event.kind==="PAYMENT"&&!reversed.has(event.id)?<button disabled={busy} className={button} onClick={()=>{const reason=window.prompt("Motivo da anulação/correção (o lançamento permanece no histórico):");if(reason?.trim())void mutate(sale,{kind:"REVERSAL",reversesId:event.id,reason:reason.trim()});}}>Anular / corrigir pagamento</button>:null}{reversed.has(event.id)?<p>Pagamento anulado; histórico preservado.</p>:null}</div>)}</div></details>
            {expanded && dashboard ? <Link className="inline-flex min-h-11 items-center text-sm underline" href={`/admin/stock?view=sales&period=all&sale=${encodeURIComponent(sale.id)}`}>Abrir na área Vendas</Link> : null}
            {expanded && renderEditor ? <details><summary className="cursor-pointer py-2 text-sm">Editar dados da venda</summary><p className="mb-2 text-xs">Pagamentos e entregas são geridos acima. Os artigos com movimentos financeiros ficam protegidos contra substituições.</p>{renderEditor(sale.id,sale.version)}</details>:null}
          </section>;
        })}</div>:null}
      </article>;
    })}
  </section>;
}

function PaymentForm({sale,sales,onSaleChange,busy,onCancel,onSubmit}:{sale:SaleAccountView;sales:SaleAccountView[];onSaleChange:(id:string)=>void;busy:boolean;onCancel:()=>void;onSubmit:(command:Command,version:string)=>Promise<void>}) {
  const [error,setError]=useState("");
  const [version] = useState(sale.version);
  return <form className="grid gap-3 rounded-xl border bg-white p-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);const raw=String(data.get("amount")).trim().replace(",",".");if(!/^\d+(\.\d{1,2})?$/.test(raw)||Number(raw)<=0){setError("Introduza um valor positivo, com até duas casas decimais.");return;}const day=String(data.get("date"));const command:Command={kind:"PAYMENT",amount:Math.round(Number(raw)*100),method:String(data.get("method")),movementId:String(data.get("movementId"))||undefined,...(day!==getAzoresDateKey()?{occurredAt:new Date(Math.max(getAzoresDateStart(day).getTime(), Date.parse(sale.createdAt))).toISOString()}:{})};void onSubmit(command,version);}}>
    <label className="text-xs">Venda<select aria-label="Venda do pagamento" className={field} value={sale.id} onChange={e=>onSaleChange(e.target.value)}>{sales.filter(s=>s.outstanding>0).map(s=><option key={s.id} value={s.id}>{s.id} · {formatPrice(s.outstanding)}</option>)}</select></label>
    <label className="text-xs">Valor recebido (€)<input name="amount" aria-label="Valor recebido (€)" inputMode="decimal" required autoFocus className={field}/></label>
    <label className="text-xs">Atribuição<select name="movementId" className={field}><option value="">Saldo da venda (sem produto específico)</option>{sale.items.filter(i=>i.outstanding>0).map(i=><option key={i.id} value={i.id}>{i.name} · {formatPrice(i.outstanding)}</option>)}</select></label>
    <label className="text-xs">Método<select name="method" className={field}>{Object.entries(methods).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label>
    <label className="text-xs">Data (Açores)<input name="date" type="date" required min={getAzoresDateKey(new Date(sale.createdAt))} max={getAzoresDateKey()} defaultValue={getAzoresDateKey()} className={field}/></label>
    <p className="self-center text-xs">Confirme a venda e o valor. O stock não será alterado. Para corrigir, anule o lançamento e registe o valor correto.</p>
    {error?<p role="alert">{error}</p>:null}<div className="flex gap-2 sm:col-span-2"><button type="button" disabled={busy} onClick={onCancel} className={button}>Cancelar</button><button disabled={busy} className={`${button} bg-[color:var(--gold)] text-white`}>{busy?"A guardar…":"Confirmar pagamento"}</button></div>
  </form>;
}
function DeliveryControl({item,busy,onSave}:{item:SaleAccountView["items"][number];busy:boolean;onSave:(qty:number,reason?:string)=>Promise<boolean>}) {
  const [value,setValue]=useState(item.delivered);
  return <div className="mt-2 flex flex-wrap items-end gap-2"><label className="text-xs">Unidades entregues<input aria-label={`Unidades entregues de ${item.name}`} type="number" min={0} max={item.quantity} step={1} value={value} onChange={e=>setValue(Number(e.target.value))} className={`${field} max-w-24`}/></label><button disabled={busy||value===item.delivered} className={button} onClick={()=>{const reason=value<item.delivered?window.prompt("Motivo da correção da entrega:")?.trim():undefined;if(value<item.delivered&&!reason)return;void onSave(value,reason);}}>Guardar entrega</button>{item.undelivered>0?<button disabled={busy} className={button} onClick={()=>void onSave(item.quantity)}>Marcar como entregue</button>:null}</div>;
}
