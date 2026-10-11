"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, CalendarDays, ChartColumn, Clock3, Euro, Info, ShoppingBag, ShoppingCart, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { statisticsHref, shiftStatisticsDay, type StatisticsNavigation, type statisticsSelection } from "@/lib/statistics-navigation";
import type { getStatisticsData, resolveStatisticsRange, StatisticsPeriod } from "@/lib/statistics";

type Data = Awaited<ReturnType<typeof getStatisticsData>>;
type Range = ReturnType<typeof resolveStatisticsRange>;
type Item = { name: string; value: number; id?: string };
type Selection = ReturnType<typeof statisticsSelection>;
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
  return <article className={`${panel} flex flex-col items-start gap-2 sm:flex-row sm:gap-3`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--sand-soft)] text-[color:var(--gold)]">{icon}</span><div className="min-w-0"><p className="text-xs text-slate-600">{label}</p><strong className="my-1 block break-words font-serif text-xl leading-tight text-[color:var(--ink)] sm:text-2xl">{value}</strong><Comparison current={current} previous={previous} lowerIsBetter={lowerIsBetter} /></div></article>;
}
function Modal({ title, children, trigger, description }: { title: string; children: React.ReactNode; trigger: React.ReactNode; description: string }) {
  return <Dialog.Root><Dialog.Trigger asChild>{trigger}</Dialog.Trigger><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] flex max-h-[90dvh] w-[calc(100%_-_1.5rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[color:var(--line)] bg-white shadow-xl">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[color:var(--line)] p-4"><div className="min-w-0"><Dialog.Title className="font-serif text-2xl">{title}</Dialog.Title><Dialog.Description className="mt-1 text-xs text-slate-500">{description}</Dialog.Description></div><Dialog.Close aria-label="Fechar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--line)] hover:bg-[color:var(--sand-soft)]"><X className="h-5 w-5" /></Dialog.Close></header>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-4">{children}</div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
function RankingRows({ items, onSelect }: { items: Item[]; onSelect?: (item: Item) => void }) {
  return <ol className="divide-y divide-[color:var(--line)]">{items.map((item, index) => <li key={item.id ?? item.name}>
    {onSelect || item.id ? <button onClick={() => onSelect?.(item)} className="flex min-h-12 w-full items-center gap-2 py-2 text-left text-sm hover:text-[color:var(--gold)]"><span className="w-6 shrink-0 text-slate-500">{index + 1}</span><span className="min-w-0 flex-1 break-words">{item.name}</span><strong>{number(item.value)}</strong><ChevronRight className="h-4 w-4 shrink-0" /></button> : <div className="flex min-h-12 items-center gap-2 py-2 text-sm"><span className="w-6 shrink-0 text-slate-500">{index + 1}</span><span className="min-w-0 flex-1 break-words">{item.name}</span><strong>{number(item.value)}</strong></div>}
  </li>)}</ol>;
}
function CompleteRanking({ items, onSelect }: { items: Item[]; onSelect?: (item: Item) => void }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filtered = items.filter(item => item.name.toLocaleLowerCase("pt-PT").includes(search.toLocaleLowerCase("pt-PT")));
  const pages = Math.max(1, Math.ceil(filtered.length / 50));
  return <><label className="block text-xs text-slate-600">Pesquisar na lista<input className="mt-1 h-11 w-full rounded-xl border border-[color:var(--line)] px-3 text-sm" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label><RankingRows items={filtered.slice((page - 1) * 50, page * 50)} onSelect={onSelect} />{!filtered.length ? <p className="py-3 text-sm text-slate-500">Sem resultados.</p> : null}{pages > 1 ? <div className="mt-3 flex items-center justify-between gap-2 text-sm"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border p-2 disabled:opacity-40">Anterior</button><span>{page} / {pages}</span><button disabled={page === pages} onClick={() => setPage(page + 1)} className="rounded-lg border p-2 disabled:opacity-40">Seguinte</button></div> : null}</>;
}
function Ranking({ name, items, range, available = true, onSelect }: { name: RankingKey; items: Item[]; range: Range; available?: boolean; onSelect?: (item: Item) => void }) {
  return <section className={panel}><div className="flex items-start justify-between gap-2"><h3 className="font-serif text-lg leading-snug sm:text-xl">{rankingTitles[name]}</h3>{items.length > 5 ? <Modal title={rankingTitles[name]} description={`${dateLabel(range.from)} – ${dateLabel(range.to)}`} trigger={<button className="inline-flex min-h-9 shrink-0 items-center gap-1 text-xs text-[color:var(--atlantic)]">Ver todos <ArrowRight className="h-3 w-3" /></button>}><CompleteRanking items={items} onSelect={onSelect} /></Modal> : null}</div>{items.length ? <RankingRows items={items.slice(0, 5)} onSelect={onSelect} /> : <p className="mt-3 text-xs text-slate-500">{available ? "Sem registos neste período." : "Dados indisponíveis"}</p>}</section>;
}
function PeriodNavigation({ overview, data, selection }: { overview: StatisticsNavigation; data: Data; selection: Selection }) {
  const context = selection.context;
  const calendar = overview.period === "month" || !!selection.month;
  const year = overview.period === "year" && !selection.month;
  const label = year ? overview.from.slice(0, 4) : calendar ? new Intl.DateTimeFormat("pt-PT", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${context.from}T12:00:00Z`)) : `${dateLabel(context.from)} – ${dateLabel(context.to)}`;
  function move(direction: number) {
    if (calendar || year) {
      const date = new Date(`${context.from}T12:00:00Z`);
      date.setUTCMonth(date.getUTCMonth() + direction * (year ? 12 : 1));
      const anchor = date.toISOString().slice(0, 10);
      if (selection.month) return statisticsHref({ ...overview, period: "month" }, { anchor });
      return statisticsHref(overview, { anchor });
    }
    return statisticsHref(overview, { anchor: shiftStatisticsDay(overview.to, direction * (overview.period === "7d" ? 7 : 30)) });
  }
  const navigable = ["7d", "30d", "month", "year"].includes(overview.period);
  const days = data.series.filter(day => day.dateKey >= context.from && day.dateKey <= context.to);
  const dayLink = (key: string) => statisticsHref(overview, { month: selection.month, day: key });
  const value = (day: Data["series"][number], compact = false) => <><strong title={day.revenue === null ? "Dados indisponíveis" : formatPrice(day.revenue)} className="block break-words text-[10px] sm:text-sm">{day.revenue === null ? "—" : compact ? (day.revenue / 100).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) : formatPrice(day.revenue)}</strong><span className="block text-[10px] text-slate-500">{day.sales === null ? (compact ? "—" : "Sem dados") : compact ? `${number(day.sales)} v.` : `${number(day.sales)} vendas`}</span></>;
  return <section className={`${panel} space-y-3`} aria-label="Navegação por datas"><div className="flex items-center justify-between gap-2">{navigable ? <Link aria-label="Período anterior" href={move(-1)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--line)]"><ChevronLeft className="h-5 w-5" /></Link> : null}<h2 className="text-center font-serif text-lg capitalize">{label}</h2>{navigable ? <Link aria-label="Período seguinte" href={move(1)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--line)]"><ChevronRight className="h-5 w-5" /></Link> : null}</div>
    {year ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 12 }, (_, index) => {
      const month = `${overview.from.slice(0, 4)}-${String(index + 1).padStart(2, "0")}`;
      const points = days.filter(day => day.dateKey.startsWith(month));
      const known = points.some(day => day.revenue !== null);
      const total = points.reduce((sum, day) => sum + (day.revenue ?? 0), 0);
      const count = points.reduce((sum, day) => sum + (day.sales ?? 0), 0);
      const max = Math.max(1, ...days.map(day => day.revenue ?? 0));
      return <Link key={month} href={statisticsHref(overview, { month })} className="min-w-0 rounded-xl border border-[color:var(--line)] p-3 hover:bg-[color:var(--sand-soft)]"><span className="text-xs capitalize">{dateLabel(`${month}-01`, true)}</span><strong className="mt-1 block font-serif text-lg">{known ? formatPrice(total) : "Dados indisponíveis"}</strong><span className="text-xs text-slate-500">{known ? `${count} vendas` : ""}</span><div className="mt-2 flex h-8 items-end gap-px" aria-hidden="true">{points.map(day => <span key={day.dateKey} className="min-w-0 flex-1 bg-[color:var(--gold)]/60" style={{ height: `${Math.max(2, (day.revenue ?? 0) / max * 100)}%` }} />)}</div></Link>;
    })}</div> : calendar ? <><p className="text-[10px] text-slate-500">Valor recebido em € · v. = vendas pagas · — = dados indisponíveis</p><div className="grid grid-cols-7 text-center text-[10px] text-slate-500">{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(day => <span key={day}>{day}</span>)}</div><div className="grid grid-cols-7 overflow-hidden rounded-xl border border-[color:var(--line)]">{Array.from({ length: (new Date(`${context.from}T12:00:00Z`).getUTCDay() + 6) % 7 }, (_, index) => <div key={`empty-${index}`} className="bg-slate-50" />)}{days.map(day => <Link key={day.dateKey} href={dayLink(day.dateKey)} aria-label={`Consultar ${dateLabel(day.dateKey)}`} aria-current={selection.day === day.dateKey ? "date" : undefined} className={`min-w-0 border-b border-r border-[color:var(--line)] px-0.5 py-2 text-center ${selection.day === day.dateKey ? "bg-[color:var(--sand-soft)] ring-1 ring-inset ring-[color:var(--gold)]" : "hover:bg-[color:var(--sand-soft)]"}`}><span className="mb-1 block text-xs">{Number(day.dateKey.slice(-2))}</span>{value(day, true)}</Link>)}</div></> : overview.period !== "today" ? <div className={overview.period === "7d" ? "flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-7" : "grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6"}>{days.map(day => <Link key={day.dateKey} href={dayLink(day.dateKey)} aria-current={selection.day === day.dateKey ? "date" : undefined} className={`min-w-0 rounded-xl border p-3 ${overview.period === "7d" ? "w-28 shrink-0 lg:w-auto" : ""} ${selection.day === day.dateKey ? "border-[color:var(--gold)] bg-[color:var(--sand-soft)]" : "border-[color:var(--line)] hover:bg-[color:var(--sand-soft)]"}`}><span className="block text-xs capitalize">{new Intl.DateTimeFormat("pt-PT", { weekday: "short", timeZone: "UTC" }).format(new Date(`${day.dateKey}T12:00:00Z`))}</span><span className="mb-2 block text-[11px] text-slate-500">{day.dateKey.slice(8)}/{day.dateKey.slice(5, 7)}</span>{value(day)}</Link>)}</div> : null}
    {selection.day || selection.month ? <Link href={statisticsHref(overview, selection.day && selection.month ? { month: selection.month } : {})} className="inline-flex min-h-10 items-center gap-2 text-sm text-[color:var(--atlantic)]"><ArrowLeft className="h-4 w-4" />{selection.day && selection.month ? "Voltar ao mês" : "Voltar ao período"}</Link> : null}
  </section>;
}
function SalesChart({ data, range, overview, selection }: { data: Data; range: Range; overview: StatisticsNavigation; selection: Selection }) {
  const [hour, setHour] = useState<number | null>(null);
  const hourly = range.from === range.to;
  const monthly = data.series.length > 90;
  const buckets = new Map<string, { revenue: number; sales: number; known: boolean }>();
  for (const day of data.series) {
    const key = monthly ? `${day.dateKey.slice(0, 7)}-01` : day.dateKey;
    const bucket = buckets.get(key) ?? { revenue: 0, sales: 0, known: false };
    bucket.revenue += day.revenue ?? 0; bucket.sales += day.sales ?? 0; bucket.known ||= day.revenue !== null;
    buckets.set(key, bucket);
  }
  const points = hourly ? data.hourlySales.map(point => ({ key: point.label, label: point.label, revenue: point.revenue, sales: point.value, known: true })) : [...buckets].map(([key, point]) => ({ key, label: dateLabel(key, monthly), ...point }));
  const max = Math.max(1, ...points.map(point => point.revenue));
  const barClass = "flex min-w-0 flex-1 flex-col justify-end rounded-t-sm focus-visible:outline-2 focus-visible:outline-[color:var(--atlantic)]";
  return <section className={panel}><h2 className="font-serif text-xl">Evolução das vendas pagas</h2><p className="mt-1 text-xs text-slate-500">{hourly ? "Por hora · Açores" : monthly ? "Por mês" : "Por dia"} · Valor recebido e número de vendas. {hourly ? "Toque numa barra para consultar a hora." : "Toque numa barra para abrir o detalhe."}</p><div className="mt-4 flex h-40 items-stretch gap-1 border-b border-[color:var(--line)] sm:h-48" aria-label="Gráfico das vendas pagas">{points.map((point, index) => {
    const content = <span className={`block rounded-t-sm ${point.known ? "bg-[color:var(--gold)]/75" : "bg-slate-200"}`} style={{ height: `${Math.max(3, point.revenue / max * 100)}%` }} />;
    const label = `${point.label}: ${point.known ? `${formatPrice(point.revenue)}, ${point.sales} vendas pagas` : "Dados indisponíveis"}`;
    return hourly ? <button key={point.key} className={barClass} aria-label={label} title={label} onClick={() => setHour(index)}>{content}</button> : <Link key={point.key} className={barClass} aria-label={label} title={label} href={statisticsHref(overview, monthly ? { month: point.key.slice(0, 7) } : { month: selection.month, day: point.key })}>{content}</Link>;
  })}</div><div className="mt-2 flex justify-between gap-2 text-[10px] text-slate-500"><span>{points[0]?.label}</span><span>{points.at(-1)?.label}</span></div>{hour !== null && points[hour] ? <p aria-live="polite" className="mt-2 text-xs">{points[hour].label}: {formatPrice(points[hour].revenue)} · {points[hour].sales} vendas pagas</p> : null}</section>;
}
export function StatisticsView({ data, previous, overviewData, overview, selection }: { data: Data; previous: Data; overviewData: Data; overview: StatisticsNavigation; selection: Selection }) {
  const range = selection.range as Range;
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [filter, setFilter] = useState<{ type: "brand" | "audience"; name: string } | null>(null);
  const [product, setProduct] = useState<Item | null>(null);
  const sold = data.allRankings.sold.filter(item => !filter || item[filter.type] === filter.name);
  const productDetail = product?.id ? data.allRankings.sold.find(item => item.id === product.id) : undefined;
  const siteMetrics = [
    { label: "Visitas com consentimento", key: "visits", availability: "visits" },
    { label: "Produtos visualizados", key: "views", availability: "views" },
    { label: "Adições ao carrinho", key: "addToCartEvents", availability: "cart" },
    { label: "Unidades adicionadas", key: "addedUnits", availability: "cart" },
    { label: "Avanços para WhatsApp", key: "checkout", availability: "whatsapp" },
    { label: "Reservas", key: "reservations", availability: "reservations" },
    { label: "Contactos gerais WhatsApp", key: "contacts", availability: "whatsapp" },
  ] as const;
  return <div className="min-w-0 space-y-4">
    <section className={`${panel} space-y-3`} aria-label="Período das estatísticas"><div className="flex flex-wrap gap-1.5">{periods.map(period => <Link key={period.value} href={period.value === "custom" ? statisticsHref({ ...overview, period: "custom" }) : `/admin/estatisticas?period=${period.value}`} aria-current={overview.period === period.value ? "true" : undefined} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs sm:text-sm ${overview.period === period.value ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white" : "border-[color:var(--line)] hover:bg-[color:var(--sand-soft)]"}`}>{period.value === "custom" ? <CalendarDays className="h-4 w-4" /> : null}{period.label}</Link>)}</div>
      {overview.period === "custom" ? <form method="get" className="grid min-w-0 gap-3 sm:grid-cols-[1fr_1fr_auto]"><input type="hidden" name="period" value="custom" /><label className="min-w-0 text-xs text-slate-600">Data inicial<input required type="date" name="from" value={from} onChange={event => setFrom(event.target.value)} className="mt-1 h-11 w-full min-w-0 max-w-full rounded-xl border border-[color:var(--line)] px-2 text-sm" /></label><label className="min-w-0 text-xs text-slate-600">Data final<input required type="date" name="to" value={to} onChange={event => setTo(event.target.value)} className="mt-1 h-11 w-full min-w-0 max-w-full rounded-xl border border-[color:var(--line)] px-2 text-sm" /></label><button className="min-h-11 self-end rounded-xl bg-[color:var(--atlantic)] px-5 text-sm text-white">Aplicar</button></form> : null}
      <p className="text-xs text-slate-500">{selection.day ? "Detalhe do dia" : selection.month ? "Detalhe do mês" : "Período"}: {dateLabel(range.from)} – {dateLabel(range.to)} · Açores</p>
    </section>
    <PeriodNavigation overview={overview} data={overviewData} selection={selection} />
    <section aria-label="Resumo geral"><h2 className="mb-3 font-serif text-2xl">Resumo geral</h2><div className="grid grid-cols-2 gap-2.5 xl:grid-cols-5">
      <Metric label="Total recebido" value={formatPrice(data.sales.paidValue)} current={data.sales.paidValue} previous={previous.sales.paidValue} icon={<ShoppingBag className="h-5 w-5" />} />
      <Metric label="Vendas pagas" value={number(data.sales.paidCount)} current={data.sales.paidCount} previous={previous.sales.paidCount} icon={<ShoppingCart className="h-5 w-5" />} />
      <Metric label="Ticket médio" value={formatPrice(data.sales.ticketAverage)} current={data.sales.ticketAverage} previous={previous.sales.ticketAverage} icon={<Euro className="h-5 w-5" />} />
      <Metric label="Total por receber" value={formatPrice(data.sales.pendingValue)} current={data.sales.pendingValue} previous={previous.sales.pendingValue} icon={<Clock3 className="h-5 w-5" />} lowerIsBetter />
      <article className={panel}><ChartColumn className="h-5 w-5 text-[color:var(--gold)]" /><p className="mt-2 text-xs text-slate-600">Lucro bruto estimado</p><strong className="my-1 block break-words font-serif text-xl">{data.sales.paidUnits > data.profit.missingCost ? formatPrice(data.profit.estimatedProfit) : "Dados indisponíveis"}</strong><p className="text-[11px] text-slate-500">{data.profit.missingCost ? `${data.profit.missingCost} unidades sem custo; estimativa parcial.` : "Custos registados ou custo atual disponível."}</p></article>
    </div></section>
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]"><SalesChart data={data} range={range} overview={overview} selection={selection} /><section className={panel}><h2 className="font-serif text-xl">Vendas por formato</h2><div className="mt-3 grid grid-cols-2 gap-2">{data.formats.map(format => <article key={format.key} className="min-w-0 rounded-xl bg-[color:var(--sand-soft)] p-3"><p className="text-xs text-slate-600">{format.name}</p><strong className="my-1 block font-serif text-2xl">{number(format.quantity)}</strong><span className="text-xs">{formatPrice(format.revenue)}</span></article>)}</div><p className="mt-3 text-[11px] text-slate-500">Apenas artigos pagos. Cada kit conta uma vez; os seus componentes não contam como decants individuais.</p></section></div>
    <section className="space-y-3"><h2 className="font-serif text-2xl">Produtos, marcas e público</h2><p className="text-xs text-slate-500">Rankings de frascos pagos. Selecione uma marca ou público para filtrar os produtos vendidos.</p>{filter ? <div className="flex items-center justify-between gap-2 rounded-xl bg-[color:var(--sand-soft)] p-3 text-sm"><span>Produtos: {filter.name}</span><button onClick={() => setFilter(null)} className="min-h-10 underline">Limpar filtro</button></div> : null}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Ranking name="sold" items={sold} range={range} onSelect={setProduct} /><Ranking name="brands" items={data.allRankings.brands} range={range} onSelect={item => setFilter({ type: "brand", name: item.name })} /><Ranking name="audiences" items={data.allRankings.audiences} range={range} onSelect={item => setFilter({ type: "audience", name: item.name })} /></div></section>
    <section className="space-y-3"><h2 className="font-serif text-2xl">Estatísticas do site</h2><p className="text-xs text-slate-500">Interações agregadas com consentimento; não representam um percurso individual de compra.</p><div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">{siteMetrics.map(metric => <article key={metric.key} className={panel}><p className="text-xs text-slate-600">{metric.label}</p><strong className="my-2 block font-serif text-xl">{data.availability[metric.availability] ? number(data.totals[metric.key]) : "Dados indisponíveis"}</strong>{data.availability[metric.availability] && previous.availability[metric.availability] ? <Comparison current={data.totals[metric.key]} previous={previous.totals[metric.key]} /> : null}</article>)}</div><div className={`${panel} text-xs text-slate-600`}><h3 className="mb-2 font-serif text-lg">Relação entre interações</h3><div className="flex flex-wrap gap-x-6 gap-y-2">{[
      { label: "Visualizações / visitas", current: data.totals.views, prior: data.totals.visits, available: data.availability.views && data.availability.visits },
      { label: "Carrinho / visualizações", current: data.totals.addToCartEvents, prior: data.totals.views, available: data.availability.cart && data.availability.views },
      { label: "WhatsApp / carrinho", current: data.totals.checkout, prior: data.totals.addToCartEvents, available: data.availability.whatsapp && data.availability.cart },
      { label: "Reservas / WhatsApp", current: data.totals.reservations, prior: data.totals.checkout, available: data.availability.reservations && data.availability.whatsapp },
    ].map(item => <p key={item.label}>{item.label}: <strong>{item.available && item.prior > 0 ? `${(item.current / item.prior * 100).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}%` : "Dados indisponíveis"}</strong></p>)}</div><p className="mt-2 text-[11px]">Relações entre totais agregados, podem superar 100%; não são taxas de conversão de pessoas.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(["viewed", "added", "whatsapp", "reservations", "searches", "zeroSearches"] as const).map(name => <Ranking key={name} name={name} items={data.allRankings[name]} range={range} available={data.availability[name === "viewed" ? "views" : name === "added" ? "cart" : name === "zeroSearches" ? "searches" : name]} onSelect={["viewed", "added", "whatsapp", "reservations"].includes(name) ? setProduct : undefined} />)}</div></section>
    <Modal title="Como são calculados os dados?" description="Metodologia e limites dos dados existentes." trigger={<button className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-3 text-xs text-[color:var(--atlantic)]"><Info className="h-4 w-4" />Como são calculados os dados?</button>}><div className="space-y-4 text-sm leading-relaxed text-slate-600"><p><strong>Datas:</strong> data de registo da venda no fuso Atlantic/Azores. O estado atual de pagamento é aplicado a essa data; não existe uma data histórica de recebimento separada.</p><p><strong>Vendas:</strong> quantidades × preço histórico dos movimentos pagos, em grupos sem linhas por pagar. Cada grupo conta uma venda; movimentos antigos sem grupo contam individualmente. Ofertas e movimentos de anulação não entram no recebido. Por receber inclui apenas linhas por pagar.</p><p><strong>Lucro:</strong> utiliza a lógica do Dashboard, com o custo histórico registado ou, na sua ausência, o custo atual do produto e a proporção do decant. Unidades sem custo ficam excluídas e são identificadas. Vendas anteriores não são modificadas.</p><p><strong>Formatos:</strong> kits separados dos decants individuais; valor dos kits soma os seus componentes. Rankings comerciais incluem frascos pagos. Rankings do site incluem interações, não vendas.</p><p><strong>Site:</strong> cada browser com consentimento conta no máximo uma visita por dia. Não corresponde a utilizadores únicos no período. Dados anteriores ao início da recolha ou sem evidência de recolha aparecem como indisponíveis. {number(data.migratedVisitDays)} dias históricos incorporados sem duplicação.</p><p><strong>Comparações:</strong> período anterior com a mesma duração. Sem base anterior não se calcula percentagem. Datas futuras não têm dados disponíveis.</p></div></Modal>
    <Dialog.Root open={!!product} onOpenChange={open => { if (!open) setProduct(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[110] bg-black/45" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[111] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-xl"><Dialog.Title className="pr-10 font-serif text-2xl">{product?.name}</Dialog.Title><Dialog.Description className="mt-2 text-sm text-slate-600">{dateLabel(range.from)} – {dateLabel(range.to)}</Dialog.Description><Dialog.Close aria-label="Fechar detalhe do produto" className="absolute right-3 top-3 p-2"><X className="h-5 w-5" /></Dialog.Close>{productDetail ? <p className="mt-4 text-sm">{productDetail.value} frascos pagos · {formatPrice(productDetail.revenue)}<br />{productDetail.brand} · {productDetail.audience}</p> : <p className="mt-4 text-sm">{product?.value} interações neste ranking.</p>}{product?.id ? <Link href={`/admin/produtos?editar=${encodeURIComponent(product.id)}#editar-produto`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[color:var(--gold)] px-4 text-sm text-white">Abrir ficha do produto <ArrowRight className="h-4 w-4" /></Link> : null}</Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
