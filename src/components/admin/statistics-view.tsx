"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { ArrowDown, ArrowRight, CalendarDays, ChartColumn, Clock3, Euro, Eye, Info, MousePointer2, ShoppingBag, ShoppingCart, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { getStatisticsData, resolveStatisticsRange, StatisticsPeriod } from "@/lib/statistics";

type Data = Awaited<ReturnType<typeof getStatisticsData>>;
type Range = ReturnType<typeof resolveStatisticsRange>;
type Tab = "sales" | "site" | "products";
type RankingKey = keyof Data["allRankings"];
const number = (value: number) => value.toLocaleString("pt-PT");
const panel = "min-w-0 rounded-2xl border border-[color:var(--line)] bg-white p-3.5 sm:p-5";
const periods: { value: StatisticsPeriod; label: string }[] = [
  { value: "today", label: "Hoje" }, { value: "7d", label: "7 dias" }, { value: "30d", label: "30 dias" },
  { value: "month", label: "Este mês" }, { value: "year", label: "Este ano" }, { value: "custom", label: "Personalizado" },
];
const rankingTitles: Record<RankingKey, string> = {
  sold: "Produtos mais vendidos", brands: "Marcas mais vendidas", audiences: "Público mais vendido",
  viewed: "Produtos mais vistos", added: "Mais adicionados ao carrinho", whatsapp: "Mais enviados para encomenda/WhatsApp",
  reservations: "Mais reservados", searches: "Pesquisas mais realizadas", zeroSearches: "Pesquisas sem resultados",
};
function dateLabel(key: string, monthOnly = false) {
  return new Intl.DateTimeFormat("pt-PT", { timeZone: "UTC", ...(monthOnly ? { month: "short", year: "numeric" } : { day: "numeric", month: "short", year: "numeric" }) }).format(new Date(`${key}T12:00:00Z`));
}
function Comparison({ current, previous, lowerIsBetter = false }: { current: number; previous: number; lowerIsBetter?: boolean }) {
  if (!previous) return <span className="text-[11px] text-slate-500">{current ? "Sem base anterior" : "Sem alteração"}</span>;
  const change = ((current - previous) / previous) * 100;
  const positive = lowerIsBetter ? change <= 0 : change >= 0;
  return <span className={`text-[11px] ${positive ? "text-emerald-700" : "text-rose-700"}`}>{change > 0 ? "↑" : change < 0 ? "↓" : "="} {Math.abs(change).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}% <span className="text-slate-500">vs. período anterior</span></span>;
}
function Metric({ label, value, current, previous, icon, lowerIsBetter }: { label: string; value: string; current: number; previous: number; icon: React.ReactNode; lowerIsBetter?: boolean }) {
  return <article className={`${panel} flex items-start gap-3`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--sand-soft)] text-[color:var(--gold)]">{icon}</span><div className="min-w-0"><p className="text-xs text-slate-600">{label}</p><strong className="my-1 block break-words font-serif text-xl leading-tight text-[color:var(--ink)] sm:text-2xl">{value}</strong><Comparison current={current} previous={previous} lowerIsBetter={lowerIsBetter} /></div></article>;
}
function Modal({ title, children, trigger, description }: { title: string; children: React.ReactNode; trigger: React.ReactNode; description: string }) {
  return <Dialog.Root><Dialog.Trigger asChild>{trigger}</Dialog.Trigger><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] flex max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[color:var(--line)] bg-white shadow-xl">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[color:var(--line)] p-4"><div className="min-w-0"><Dialog.Title className="font-serif text-2xl">{title}</Dialog.Title><Dialog.Description className="mt-1 text-xs text-slate-500">{description}</Dialog.Description></div><Dialog.Close aria-label="Fechar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--line)] hover:bg-[color:var(--sand-soft)]"><X className="h-5 w-5" /></Dialog.Close></header>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-4">{children}</div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
function CompleteRanking({ items }: { items: Data["allRankings"][RankingKey] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filtered = items.map((item, index) => ({ ...item, rank: index + 1 })).filter((item) => item.name.toLocaleLowerCase("pt-PT").includes(search.toLocaleLowerCase("pt-PT")));
  const pages = Math.max(1, Math.ceil(filtered.length / 50));
  return <><label className="block text-xs text-slate-600">Pesquisar na lista<input className="mt-1 h-11 w-full min-w-0 rounded-xl border border-[color:var(--line)] px-3 text-sm" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label><ol className="mt-3 divide-y divide-[color:var(--line)]">{filtered.slice((page - 1) * 50, page * 50).map((item) => <li key={`${item.name}:${item.rank}`} className="flex min-w-0 items-center gap-3 py-3 text-sm"><span className="w-6 shrink-0 text-slate-500">{item.rank}</span><span className="min-w-0 flex-1 break-words">{item.name}</span><strong className="shrink-0">{number(item.value)}</strong></li>)}</ol>{!filtered.length ? <p className="py-3 text-sm text-slate-500">Sem resultados.</p> : null}{pages > 1 ? <div className="mt-3 flex items-center justify-between gap-2 text-sm"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border p-2 disabled:opacity-40">Anterior</button><span>{page} / {pages}</span><button disabled={page === pages} onClick={() => setPage(page + 1)} className="rounded-lg border p-2 disabled:opacity-40">Seguinte</button></div> : null}</>;
}
function Ranking({ name, data, range }: { name: RankingKey; data: Data; range: Range }) {
  const items = data.allRankings[name];
  return <section className={panel}><div className="flex items-start justify-between gap-2"><h3 className="font-serif text-lg leading-snug sm:text-xl">{rankingTitles[name]}</h3>{items.length > 5 ? <Modal title={rankingTitles[name]} description={`${dateLabel(range.from)} – ${dateLabel(range.to)}`} trigger={<button className="inline-flex min-h-9 shrink-0 items-center gap-1 text-xs text-[color:var(--atlantic)]">Ver todos <ArrowRight className="h-3 w-3" /></button>}><CompleteRanking items={items} /></Modal> : null}</div>{items.length ? <ol className="mt-2 divide-y divide-[color:var(--line)]">{items.slice(0, 5).map((item, index) => <li key={item.name} className="flex min-w-0 items-center gap-2 py-2.5 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--sand-soft)] text-xs">{index + 1}</span><span className="min-w-0 flex-1 break-words">{item.name}</span><strong className="shrink-0">{number(item.value)}</strong></li>)}</ol> : <p className="mt-2 text-xs text-slate-500">Sem dados neste período.</p>}</section>;
}
function SalesChart({ data, range }: { data: Data; range: Range }) {
  const duration = Math.round((Date.parse(range.to) - Date.parse(range.from)) / 86400000) + 1;
  const monthly = duration > 90;
  const buckets = new Map<string, number>();
  for (const day of data.series) {
    if (day.sales === null) continue;
    const key = monthly ? `${day.dateKey.slice(0, 7)}-01` : day.dateKey;
    buckets.set(key, (buckets.get(key) ?? 0) + day.sales);
  }
  const points = duration === 1 ? data.hourlySales : [...buckets].map(([date, value]) => ({ label: dateLabel(date, monthly), value }));
  const sufficient = points.filter((point) => point.value > 0).length > 1;
  const max = Math.max(1, ...points.map((point) => point.value));
  const [selected, setSelected] = useState<number | null>(null);
  return <section className={panel}><h2 className="font-serif text-xl">Evolução das vendas pagas</h2><p className="mt-1 text-xs text-slate-500">{duration === 1 ? "Por hora · Açores" : monthly ? "Por mês" : "Por dia"} · {number(data.sales.paidCount)} vendas</p>{sufficient ? <><div className="mt-4 flex h-36 items-end gap-1 border-b border-[color:var(--line)] sm:h-44" aria-label="Gráfico das vendas pagas">{points.map((point, index) => <button key={`${point.label}:${index}`} aria-label={`${point.label}: ${number(point.value)} vendas pagas`} title={`${point.label}: ${number(point.value)}`} onClick={() => setSelected(index)} className={`min-w-0 flex-1 rounded-t-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--atlantic)] ${selected === index ? "bg-[color:var(--atlantic)]" : "bg-[color:var(--gold)]/75 hover:bg-[color:var(--gold)]"}`} style={{ height: `${Math.max(point.value ? 3 : 0.5, point.value / max * 100)}%` }} />)}</div><div className="mt-2 flex justify-between gap-2 text-[10px] text-slate-500"><span>{points[0]?.label}</span><span>{points.at(-1)?.label}</span></div><p aria-live="polite" className="mt-2 min-h-4 text-xs text-slate-600">{selected === null ? "Toque numa barra para consultar o valor." : `${points[selected].label}: ${number(points[selected].value)} vendas pagas`}</p></> : <p className="mt-3 text-sm text-slate-500">Dados insuficientes para mostrar uma evolução neste período.</p>}</section>;
}
export function StatisticsView({ data, previous, range, initialTab }: { data: Data; previous: Data; range: Range; initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const funnel: { label: string; value: number; available: boolean }[] = [
    { label: "Visitas", value: data.totals.visits, available: data.availability.visits },
    { label: "Produtos vistos", value: data.totals.views, available: data.availability.views },
    { label: "Carrinho", value: data.totals.addToCartEvents, available: data.availability.cart },
    { label: "WhatsApp", value: data.totals.checkout, available: data.availability.whatsapp },
    ...(data.availability.reservations ? [{ label: "Reservas", value: data.totals.reservations, available: true }] : []),
  ];
  return <div className="min-w-0 space-y-4">
    <div className="flex justify-end"><Modal title="Como são calculados os dados?" description="Metodologia e limites dos dados existentes." trigger={<button className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-3 text-xs text-[color:var(--atlantic)]"><Info className="h-4 w-4" />Como são calculados os dados?</button>}><div className="space-y-4 text-sm leading-relaxed text-slate-600">
      <p><strong>Vendas reais:</strong> movimentos de venda registados no Stock, filtrados pela data de registo no fuso dos Açores. O sistema não dispõe de uma data histórica de recebimento: o estado de pagamento atual é aplicado à data de registo da venda.</p>
      <p><strong>Total recebido:</strong> soma das quantidades × preço de venda dos movimentos pagos, em grupos sem linhas por pagar. Uma venda é contada uma vez por grupo; movimentos antigos sem grupo contam individualmente. Ofertas não entram no valor recebido.</p>
      <p><strong>Ticket médio:</strong> total recebido ÷ vendas pagas. Sem vendas pagas, o valor é 0,00 €. Por receber soma apenas linhas por pagar no período.</p>
      <p><strong>Formatos e rankings:</strong> frascos, decants individuais de 5 ml, de 10 ml e kits separados. Componentes de kits não contam como decants individuais. Rankings comerciais de produtos, marcas e público incluem apenas frascos pagos. {number(data.sales.paidUnits)} unidades de movimentos pagos neste período.</p>
      <p><strong>Visitas e consentimento:</strong> apenas visitantes que aceitaram Analytics. Cada browser conta no máximo uma vez por dia; não representa utilizadores únicos ao longo de todo o período. Para sessões e utilizadores, consulte também o GA4.</p>
      <p><strong>Funil:</strong> comparação de totais agregados entre etapas; não identifica as mesmas pessoas nem mede uma conversão individual. Percentagens podem superar 100% e ficam indisponíveis quando a etapa anterior é zero ou não tem dados.</p>
      <p><strong>Comparação:</strong> período imediatamente anterior com o mesmo número de dias. Sem valor anterior, não é calculada uma percentagem. Uma redução do valor por receber é apresentada como evolução favorável.</p>
      <p><strong>Histórico:</strong> {number(data.migratedVisitDays)} dias antigos incorporados sem duplicação. Métricas de comportamento podem não existir antes do início da recolha. Um gráfico requer pelo menos dois intervalos com vendas.</p>
    </div></Modal></div>
    <section className={`${panel} space-y-3`} aria-label="Período das estatísticas"><div className="flex flex-wrap gap-1.5">{periods.map((period) => <Link key={period.value} href={`/admin/estatisticas?period=${period.value}&tab=${tab}${period.value === "custom" ? `&from=${range.from}&to=${range.to}` : ""}`} aria-current={range.period === period.value ? "true" : undefined} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs sm:text-sm ${range.period === period.value ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white" : "border-[color:var(--line)] hover:bg-[color:var(--sand-soft)]"}`}>{period.value === "custom" ? <CalendarDays className="h-4 w-4" /> : null}{period.label}</Link>)}</div>
      {range.period === "custom" ? <form method="get" className="grid min-w-0 gap-3 sm:grid-cols-[1fr_1fr_auto]"><input type="hidden" name="period" value="custom" /><input type="hidden" name="tab" value={tab} /><label className="min-w-0 text-xs text-slate-600">Data inicial<input required type="date" name="from" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 h-11 w-full min-w-0 max-w-full rounded-xl border border-[color:var(--line)] px-2 text-sm" /></label><label className="min-w-0 text-xs text-slate-600">Data final<input required type="date" name="to" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 h-11 w-full min-w-0 max-w-full rounded-xl border border-[color:var(--line)] px-2 text-sm" /></label><button className="min-h-11 self-end rounded-xl bg-[color:var(--atlantic)] px-5 text-sm text-white">Aplicar</button></form> : null}
      <p className="text-xs text-slate-500">Período: {dateLabel(range.from)} – {dateLabel(range.to)} · Açores</p>
    </section>
    <div role="tablist" aria-label="Áreas das estatísticas" className="grid grid-cols-3 gap-1.5">{([["sales", "Vendas"], ["site", "Site"], ["products", "Produtos"]] as const).map(([key, label]) => <button key={key} role="tab" id={`tab-${key}`} aria-controls={`panel-${key}`} aria-selected={tab === key} onClick={() => setTab(key)} className={`min-h-11 rounded-xl border text-sm font-semibold ${tab === key ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white" : "border-[color:var(--line)] bg-white hover:bg-[color:var(--sand-soft)]"}`}>{label}</button>)}</div>
    <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="min-w-0 space-y-4">
      {tab === "sales" ? <><section><h2 className="mb-3 font-serif text-2xl">Resumo de vendas</h2><div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total recebido" value={formatPrice(data.sales.paidValue)} current={data.sales.paidValue} previous={previous.sales.paidValue} icon={<ShoppingBag className="h-5 w-5" />} />
        <Metric label="Vendas pagas" value={number(data.sales.paidCount)} current={data.sales.paidCount} previous={previous.sales.paidCount} icon={<ShoppingCart className="h-5 w-5" />} />
        <Metric label="Ticket médio" value={formatPrice(data.sales.ticketAverage)} current={data.sales.ticketAverage} previous={previous.sales.ticketAverage} icon={<Euro className="h-5 w-5" />} />
        <Metric label="Por receber" value={formatPrice(data.sales.pendingValue)} current={data.sales.pendingValue} previous={previous.sales.pendingValue} icon={<Clock3 className="h-5 w-5" />} lowerIsBetter />
      </div></section><div className="grid gap-4 xl:grid-cols-2"><section className={panel}><h2 className="font-serif text-xl">Vendas por formato</h2><div className="mt-3 grid grid-cols-2 gap-2">{([["Frascos", "bottles"], ["Decants individuais 5 ml", "fiveMl"], ["Decants individuais 10 ml", "tenMl"], ["Kits de decants", "decantKits"]] as const).map(([label, key]) => <div key={key} className="rounded-xl bg-[color:var(--sand-soft)] p-3"><p className="text-xs leading-snug text-slate-600">{label}</p><strong className="my-1 block font-serif text-2xl">{number(data.sales[key])}</strong><Comparison current={data.sales[key]} previous={previous.sales[key]} /></div>)}</div></section><SalesChart data={data} range={range} /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(["sold", "brands", "audiences"] as const).map((name) => <Ranking key={name} name={name} data={data} range={range} />)}</div></> : null}
      {tab === "site" ? <><div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"><section className={panel}><h2 className="font-serif text-xl">Comportamento no site</h2><div className="mt-3 grid grid-cols-2 gap-2">{([
        ["Visitas com consentimento", "visits", "visits", <Eye key="visits" className="h-4 w-4" />], ["Produtos vistos", "views", "views", <Eye key="views" className="h-4 w-4" />],
        ["Adições ao carrinho", "addToCartEvents", "cart", <ShoppingCart key="cart" className="h-4 w-4" />], ["Avanços para WhatsApp", "checkout", "whatsapp", <MousePointer2 key="wa" className="h-4 w-4" />],
        ...(data.availability.reservations ? [["Reservas", "reservations", "reservations", <ChartColumn key="reservations" className="h-4 w-4" />]] as const : []),
      ] as const).map(([label, key, availability, icon]) => <article key={key} className="min-w-0 rounded-xl bg-[color:var(--sand-soft)] p-3"><span className="text-[color:var(--gold)]">{icon}</span><p className="mt-2 text-xs text-slate-600">{label}</p><strong className="my-1 block font-serif text-2xl">{data.availability[availability] ? number(data.totals[key]) : "—"}</strong>{data.availability[availability] ? <Comparison current={data.totals[key]} previous={previous.totals[key]} /> : <span className="text-xs text-slate-500">Sem dados</span>}</article>)}</div></section>
        <section className={panel}><h2 className="font-serif text-xl">Funil do site</h2><p className="mt-1 text-[11px] text-slate-500">Totais agregados, sem percurso individual.</p><ol className="mt-3">{funnel.map((stage, index) => { const prior = funnel[index - 1]; const rate = prior?.available && prior.value > 0 && stage.available ? `${(stage.value / prior.value * 100).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}%` : "—"; return <li key={stage.label}>{index ? <ArrowDown className="mx-auto my-1 h-3 w-3 text-[color:var(--gold)]" /> : null}<div className="mx-auto flex items-center justify-between gap-2 rounded-lg bg-[color:var(--gold)]/15 px-3 py-2 text-xs" style={{ width: `${100 - index * 7}%` }}><span>{stage.label}</span><strong>{stage.available ? number(stage.value) : "—"}</strong></div>{index ? <p className="mt-1 text-center text-[10px] text-slate-500">{rate} da etapa anterior</p> : null}</li>; })}</ol></section></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(["viewed", "searches", "zeroSearches"] as const).map((name) => <Ranking key={name} name={name} data={data} range={range} />)}</div></> : null}
      {tab === "products" ? <div className="grid gap-4 md:grid-cols-2">{(["viewed", "added", "whatsapp", ...(data.availability.reservations ? ["reservations" as const] : [])] as const).map((name) => <Ranking key={name} name={name} data={data} range={range} />)}</div> : null}
    </div>
  </div>;
}
