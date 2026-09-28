import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import {
  getStatisticsData,
  resolveStatisticsRange,
  type StatisticsMetric,
  type StatisticsPeriod,
} from "@/lib/statistics";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const periods: { value: StatisticsPeriod; label: string }[] = [
  { value: "today", label: "Hoje" }, { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" }, { value: "month", label: "Este mês" },
  { value: "year", label: "Este ano" }, { value: "previous-year", label: "Ano anterior" },
  { value: "custom", label: "Personalizado" },
];
const metrics: { value: StatisticsMetric; label: string }[] = [
  { value: "visits", label: "Visitas" }, { value: "views", label: "Produtos vistos" },
  { value: "cart", label: "AddToCart" }, { value: "whatsapp", label: "WhatsApp" },
  { value: "orders", label: "Pedidos" }, { value: "sales", label: "Vendas pagas" },
  { value: "revenue", label: "Valor pago" },
];

function stringParam(value: string | string[] | undefined) { return typeof value === "string" ? value : undefined; }
function periodHref(period: StatisticsPeriod, metric: StatisticsMetric) { return `/admin/estatisticas?period=${period}&metric=${metric}`; }
function shortDate(value: string) { return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)); }

function MetricChart({ series, metric, from, to }: {
  series: Awaited<ReturnType<typeof getStatisticsData>>["series"];
  metric: StatisticsMetric;
  from: string;
  to: string;
}) {
  const longPeriod = series.length > 62;
  const values = longPeriod
    ? [...series.reduce((map, point) => {
        const key = point.dateKey.slice(0, 7);
        const current = map.get(key) ?? { dateKey: key, value: null as number | null, known: false };
        const value = point[metric];
        if (value !== null) { current.value = (current.value ?? 0) + value; current.known = true; }
        map.set(key, current);
        return map;
      }, new Map<string, { dateKey: string; value: number | null; known: boolean }>()).values()].map((point) => ({ dateKey: point.dateKey, value: point.known ? point.value : null }))
    : series.map((point) => ({ dateKey: point.dateKey, value: point[metric] }));
  const knownValues = values.flatMap((point) => point.value === null ? [] : [point.value]);
  const max = Math.max(1, ...knownValues);
  const points = values.map((point, index) => {
    if (point.value === null) return null;
    const x = values.length === 1 ? 50 : 4 + (index / (values.length - 1)) * 92;
    const y = 88 - (point.value / max) * 72;
    return `${x},${y}`;
  });
  const segments: string[] = [];
  let segment: string[] = [];
  for (const point of points) {
    if (point) segment.push(point);
    else if (segment.length) { segments.push(segment.join(" ")); segment = []; }
  }
  if (segment.length) segments.push(segment.join(" "));

  return (
    <div className="min-w-0 overflow-hidden rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4">
      <div className="h-60 w-full">
        {knownValues.length ? (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label={`Evolução entre ${from} e ${to}`}>
            {[16, 40, 64, 88].map((y) => <line key={y} x1="4" x2="96" y1={y} y2={y} stroke="#eadfce" strokeWidth="0.45" />)}
            {segments.map((line, index) => <polyline key={index} points={line} fill="none" stroke="#9b7451" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />)}
            {points.map((point, index) => point ? <circle key={index} cx={point.split(",")[0]} cy={point.split(",")[1]} r="1.25" fill="#9b7451" /> : null)}
          </svg>
        ) : <div className="flex h-full items-center justify-center text-sm text-slate-500">Sem dados neste período.</div>}
      </div>
      <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500">
        <span>{longPeriod ? values[0]?.dateKey : shortDate(values[0]?.dateKey ?? from)}</span>
        <span>Máximo: {metric === "revenue" ? formatPrice(max) : max.toLocaleString("pt-PT")}</span>
        <span>{longPeriod ? values.at(-1)?.dateKey : shortDate(values.at(-1)?.dateKey ?? to)}</span>
      </div>
      {values.some((point) => point.value === null) ? <p className="mt-3 text-xs text-amber-700">Os intervalos anteriores ao início da recolha aparecem como sem dados.</p> : null}
    </div>
  );
}

function Ranking({ title, items, empty = "Ainda sem dados neste período." }: { title: string; items: { name: string; value: number }[]; empty?: string }) {
  return <article className="min-w-0 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4 sm:p-5">
    <h3 className="font-serif text-xl text-[color:var(--ink)]">{title}</h3>
    {items.length ? <ol className="mt-4 space-y-2">{items.map((item, index) => <li key={`${item.name}-${index}`} className="flex min-w-0 items-center gap-3 rounded-xl bg-[color:var(--sand-soft)] px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold">{index + 1}</span>
      <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span><strong className="shrink-0 text-sm">{item.value.toLocaleString("pt-PT")}</strong>
    </li>)}</ol> : <p className="mt-4 text-sm text-slate-500">{empty}</p>}
  </article>;
}

export default async function AdminStatisticsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const query = await searchParams;
  const range = resolveStatisticsRange({ period: stringParam(query.period), from: stringParam(query.from), to: stringParam(query.to) });
  const metricParam = stringParam(query.metric);
  const metric = (metrics.some((item) => item.value === metricParam) ? metricParam : "visits") as StatisticsMetric;
  const data = await getStatisticsData(range);
  const funnel: [string, number | null][] = [
    ["Visitas contabilizadas", data.availability.visits ? data.totals.visits : null], ["Produtos vistos", data.availability.views ? data.totals.views : null],
    ["Adições ao carrinho", data.availability.cart ? data.totals.addToCartEvents : null], ["Avanços para WhatsApp", data.availability.whatsapp ? data.totals.checkout : null],
    ["Pedidos iniciados", data.orders.count], ["Vendas pagas", data.sales.paidCount],
  ] as const;

  return <AdminShell title="Estatísticas" description="Evolução agregada da utilização, pedidos iniciados e vendas reais da loja.">
    <section className="space-y-3 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-3 sm:p-4">
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {periods.map((item) => <Link key={item.value} href={periodHref(item.value, metric)} className={`shrink-0 rounded-full border px-3.5 py-2 text-sm ${range.period === item.value ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white" : "border-[color:var(--line)] bg-white"}`}>{item.label}</Link>)}
      </div>
      <form method="get" className="grid min-w-0 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input type="hidden" name="period" value="custom" /><input type="hidden" name="metric" value={metric} />
        <label className="min-w-0 text-xs text-slate-500">Data inicial<input type="date" name="from" defaultValue={range.from} className="mt-1 h-11 w-full min-w-0 rounded-xl border border-[color:var(--line)] px-3 text-sm" /></label>
        <label className="min-w-0 text-xs text-slate-500">Data final<input type="date" name="to" defaultValue={range.to} className="mt-1 h-11 w-full min-w-0 rounded-xl border border-[color:var(--line)] px-3 text-sm" /></label>
        <button className="min-h-11 self-end rounded-xl bg-[color:var(--atlantic)] px-5 text-sm font-semibold text-white">Aplicar</button>
      </form>
      <p className="text-xs text-slate-500">Período: {range.from} a {range.to} · Fuso horário dos Açores</p>
    </section>

    <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
      {[
        ["Visitas contabilizadas", data.availability.visits ? data.totals.visits.toLocaleString("pt-PT") : "Sem dados"],
        ["Pedidos iniciados", data.orders.count.toLocaleString("pt-PT")],
        ["Vendas pagas", data.sales.paidCount.toLocaleString("pt-PT")],
        ["Valor pago", formatPrice(data.sales.paidValue)],
        ["Ticket médio", formatPrice(data.sales.ticketAverage)],
        ["Por receber", formatPrice(data.sales.pendingValue)],
      ].map(([label, value]) => <article key={label} className="min-w-0 rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--atlantic)]">{label}</p><p className="mt-2 break-words font-serif text-2xl text-[color:var(--ink)]">{value}</p>
      </article>)}
    </section>

    <section className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4 sm:p-5">
        <h2 className="font-serif text-2xl">Funil agregado</h2><p className="mt-1 text-xs text-slate-500">Relações entre contagens agregadas, não conversão individual de utilizadores.</p>
        <div className="mt-4 space-y-2">{funnel.map(([label, value], index) => <div key={label}><div className="flex items-center justify-between rounded-xl bg-[color:var(--sand-soft)] px-3 py-2.5"><span className="text-sm">{label}</span><strong>{value === null ? "Sem dados" : value.toLocaleString("pt-PT")}</strong></div>{index < funnel.length - 1 ? <p className="text-center text-slate-300">↓</p> : null}</div>)}</div>
      </article>
      <div className="min-w-0 space-y-3">
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{metrics.map((item) => <Link key={item.value} href={`/admin/estatisticas?period=${range.period}&from=${range.from}&to=${range.to}&metric=${item.value}`} className={`shrink-0 rounded-full border px-3 py-2 text-xs ${metric === item.value ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white" : "border-[color:var(--line)] bg-white"}`}>{item.label}</Link>)}</div>
        <MetricChart series={data.series} metric={metric} from={range.from} to={range.to} />
      </div>
    </section>

    <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Ranking title="Produtos mais vistos" items={data.rankings.viewed} />
      <Ranking title="Mais adicionados" items={data.rankings.added} />
      <Ranking title="Mais avançados para WhatsApp" items={data.rankings.whatsapp} />
      <Ranking title="Produtos mais vendidos" items={data.rankings.sold} />
      <Ranking title="Pesquisas mais realizadas" items={data.rankings.searches} />
    </section>

    <section className="mt-5 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4 text-sm text-slate-600">
      <p><strong>Pedidos iniciados:</strong> valor potencial {formatPrice(data.orders.potentialValue)}; {data.orders.cancelled} cancelado(s). Não entram automaticamente no valor pago.</p>
      <p className="mt-2"><strong>Vendas reais:</strong> {data.sales.paidUnits} unidade(s) pagas. PENDING aparece em “Por receber”; OFFERED tem valor zero.</p>
      <p className="mt-2"><strong>Histórico de visitas preservado:</strong> {data.migratedVisitDays} dia(s) existente(s) em DailySiteVisit foram incorporados pela migration sem duplicação.</p>
    </section>
  </AdminShell>;
}
