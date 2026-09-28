import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getStatisticsData, resolveStatisticsRange, type StatisticsPeriod } from "@/lib/statistics";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
type RankingKey = "viewed" | "added" | "whatsapp" | "sold" | "searches";

const periods: { value: StatisticsPeriod; label: string }[] = [
  { value: "today", label: "Hoje" }, { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" }, { value: "month", label: "Este mês" },
  { value: "year", label: "Este ano" }, { value: "previous-year", label: "Ano anterior" },
  { value: "custom", label: "Personalizado" },
];

const rankingDetails: Record<RankingKey, { title: string; valueLabel: string; productList: boolean }> = {
  viewed: { title: "Produtos mais vistos", valueLabel: "visualizações", productList: true },
  added: { title: "Mais adicionados", valueLabel: "adições", productList: true },
  whatsapp: { title: "Mais avançados para WhatsApp", valueLabel: "avanços", productList: true },
  sold: { title: "Produtos mais vendidos", valueLabel: "unidades", productList: true },
  searches: { title: "Pesquisas mais realizadas", valueLabel: "pesquisas", productList: false },
};

function stringParam(value: string | string[] | undefined) { return typeof value === "string" ? value : undefined; }
function rangeParams(range: ReturnType<typeof resolveStatisticsRange>) {
  const params = new URLSearchParams({ period: range.period });
  if (range.period === "custom") { params.set("from", range.from); params.set("to", range.to); }
  return params;
}
function statisticsHref(range: ReturnType<typeof resolveStatisticsRange>, additions?: Record<string, string>) {
  const params = rangeParams(range);
  for (const [key, value] of Object.entries(additions ?? {})) if (value) params.set(key, value);
  return `/admin/estatisticas?${params.toString()}`;
}
function periodDescription(range: ReturnType<typeof resolveStatisticsRange>) {
  const format = (value: string) => new Intl.DateTimeFormat("pt-PT", { timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
  const label = periods.find((item) => item.value === range.period)?.label ?? "Período";
  return `${label} · ${format(range.from)} — ${format(range.to)}`;
}

function Ranking({ title, items, href, empty }: { title: string; items: { name: string; value: number }[]; href: string; empty: string }) {
  return <article className="min-w-0 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3"><h3 className="font-serif text-xl text-[color:var(--ink)]">{title}</h3><Link href={href} scroll={false} className="shrink-0 rounded-full border border-[color:var(--line)] px-3 py-1.5 text-xs font-semibold text-[color:var(--atlantic)] hover:border-[color:var(--gold)]">Ver todos</Link></div>
    {items.length ? <ol className="mt-4 space-y-2">{items.map((item, index) => <li key={`${item.name}-${index}`} className="flex min-w-0 items-center gap-3 rounded-xl bg-[color:var(--sand-soft)] px-3 py-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold">{index + 1}</span>
      <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span><strong className="shrink-0 text-sm">{item.value.toLocaleString("pt-PT")}</strong>
    </li>)}</ol> : <p className="mt-4 text-sm text-slate-500">{empty}</p>}
  </article>;
}

function RankingModal({ ranking, data, range, search, page }: {
  ranking: RankingKey;
  data: Awaited<ReturnType<typeof getStatisticsData>>;
  range: ReturnType<typeof resolveStatisticsRange>;
  search: string;
  page: number;
}) {
  const details = rankingDetails[ranking];
  const available = ranking === "sold" ? Boolean(data.starts.sales && range.to >= data.starts.sales)
    : ranking === "searches" ? data.availability.searches
    : data.availability[ranking === "viewed" ? "views" : ranking === "added" ? "cart" : "whatsapp"];
  const ranked = data.allRankings[ranking].map((item, index) => ({ ...item, rank: index + 1 }));
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-PT");
  const filtered = details.productList && normalizedSearch ? ranked.filter((item) => item.name.toLocaleLowerCase("pt-PT").includes(normalizedSearch)) : ranked;
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const closeHref = statisticsHref(range);

  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="ranking-title">
    <div className="flex max-h-[94dvh] w-full min-w-0 flex-col overflow-hidden rounded-t-[1.75rem] border border-[color:var(--line)] bg-white shadow-2xl sm:max-h-[88dvh] sm:max-w-3xl sm:rounded-[1.75rem]">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[color:var(--line)] px-4 py-4 sm:px-6">
        <div className="min-w-0"><h2 id="ranking-title" className="font-serif text-2xl text-[color:var(--ink)]">{details.title}</h2><p className="mt-1 text-xs text-slate-500">{periodDescription(range)}</p></div>
        <Link href={closeHref} scroll={false} className="shrink-0 rounded-full border border-[color:var(--line)] px-3 py-2 text-sm font-semibold">Fechar</Link>
      </header>
      {details.productList ? <form className="shrink-0 border-b border-[color:var(--line)] p-3 sm:px-6" method="get">
        {[...rangeParams(range)].map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
        <input type="hidden" name="ranking" value={ranking} />
        <div className="flex gap-2"><input name="rankingSearch" defaultValue={search} placeholder="Procurar produto..." className="h-11 min-w-0 flex-1 rounded-xl border border-[color:var(--line)] px-3 text-sm" /><button className="rounded-xl bg-[color:var(--atlantic)] px-4 text-sm font-semibold text-white">Procurar</button></div>
      </form> : null}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6">
        {!available ? <p className="rounded-xl bg-[color:var(--sand-soft)] p-4 text-sm text-slate-600">Sem dados neste período.</p>
          : !visible.length ? <p className="rounded-xl bg-[color:var(--sand-soft)] p-4 text-sm text-slate-600">Nenhum resultado neste período.</p>
          : <ol className="space-y-2">{visible.map((item) => <li key={`${item.name}-${item.rank}`} className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-[color:var(--sand-soft)] px-3 py-3 sm:gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold">{item.rank}</span><span className="min-w-0 break-words text-sm">{item.name}</span><strong className="whitespace-nowrap text-sm">{item.value.toLocaleString("pt-PT")} <span className="hidden font-normal text-slate-500 sm:inline">{details.valueLabel}</span></strong>
          </li>)}</ol>}
      </div>
      {totalPages > 1 ? <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[color:var(--line)] px-4 py-3 text-sm"><span>Página {safePage} de {totalPages}</span><div className="flex gap-2">{safePage > 1 ? <Link className="rounded-full border px-3 py-1.5" href={statisticsHref(range, { ranking, rankingSearch: search, rankingPage: String(safePage - 1) })}>Anterior</Link> : null}{safePage < totalPages ? <Link className="rounded-full border px-3 py-1.5" href={statisticsHref(range, { ranking, rankingSearch: search, rankingPage: String(safePage + 1) })}>Seguinte</Link> : null}</div></footer> : null}
    </div>
  </div>;
}

export default async function AdminStatisticsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const query = await searchParams;
  const range = resolveStatisticsRange({ period: stringParam(query.period), from: stringParam(query.from), to: stringParam(query.to) });
  const rankingParam = stringParam(query.ranking);
  const ranking = rankingParam && rankingParam in rankingDetails ? rankingParam as RankingKey : null;
  const data = await getStatisticsData(range);
  const funnel: [string, number | null][] = [
    ["Visitas contabilizadas", data.availability.visits ? data.totals.visits : null], ["Produtos vistos", data.availability.views ? data.totals.views : null],
    ["Adições ao carrinho", data.availability.cart ? data.totals.addToCartEvents : null], ["Avanços para WhatsApp", data.availability.whatsapp ? data.totals.checkout : null],
    ["Pedidos iniciados", data.orders.count], ["Vendas pagas", data.sales.paidCount],
  ];
  const rankingAvailability = {
    viewed: data.availability.views, added: data.availability.cart, whatsapp: data.availability.whatsapp,
    sold: Boolean(data.starts.sales && range.to >= data.starts.sales), searches: data.availability.searches,
  };

  return <AdminShell title="Estatísticas" description="Evolução agregada da utilização, pedidos iniciados e vendas reais da loja.">
    <section className="space-y-3 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-3 sm:p-4">
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{periods.map((item) => <Link key={item.value} href={`/admin/estatisticas?period=${item.value}`} className={`shrink-0 rounded-full border px-3.5 py-2 text-sm ${range.period === item.value ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white" : "border-[color:var(--line)] bg-white"}`}>{item.label}</Link>)}</div>
      <form method="get" className="grid min-w-0 gap-2 sm:grid-cols-[1fr_1fr_auto]"><input type="hidden" name="period" value="custom" /><label className="min-w-0 text-xs text-slate-500">Data inicial<input type="date" name="from" defaultValue={range.from} className="mt-1 h-11 w-full min-w-0 rounded-xl border border-[color:var(--line)] px-3 text-sm" /></label><label className="min-w-0 text-xs text-slate-500">Data final<input type="date" name="to" defaultValue={range.to} className="mt-1 h-11 w-full min-w-0 rounded-xl border border-[color:var(--line)] px-3 text-sm" /></label><button className="min-h-11 self-end rounded-xl bg-[color:var(--atlantic)] px-5 text-sm font-semibold text-white">Aplicar</button></form>
      <p className="text-xs text-slate-500">Período: {range.from} a {range.to} · Fuso horário dos Açores</p>
    </section>

    <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-6">{[
      ["Visitas contabilizadas", data.availability.visits ? data.totals.visits.toLocaleString("pt-PT") : "Sem dados"], ["Pedidos iniciados", data.orders.count.toLocaleString("pt-PT")], ["Vendas pagas", data.sales.paidCount.toLocaleString("pt-PT")], ["Valor pago", formatPrice(data.sales.paidValue)], ["Ticket médio", formatPrice(data.sales.ticketAverage)], ["Por receber", formatPrice(data.sales.pendingValue)],
    ].map(([label, value]) => <article key={label} className="min-w-0 rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4"><p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--atlantic)]">{label}</p><p className="mt-2 break-words font-serif text-2xl text-[color:var(--ink)]">{value}</p></article>)}</section>

    <section className="mt-5 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4 sm:p-5"><h2 className="font-serif text-2xl">Funil agregado</h2><p className="mt-1 text-xs text-slate-500">Relações entre contagens agregadas, não conversão individual de utilizadores.</p><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{funnel.map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-xl bg-[color:var(--sand-soft)] px-3 py-2.5"><span className="text-sm">{label}</span><strong>{value === null ? "Sem dados" : value.toLocaleString("pt-PT")}</strong></div>)}</div></section>

    <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">{(Object.keys(rankingDetails) as RankingKey[]).map((key) => <Ranking key={key} title={rankingDetails[key].title} items={data.rankings[key]} href={statisticsHref(range, { ranking: key })} empty={rankingAvailability[key] ? "Nenhum resultado neste período." : "Sem dados neste período."} />)}</section>

    <section className="mt-5 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4 text-sm text-slate-600"><p><strong>Pedidos iniciados:</strong> valor potencial {formatPrice(data.orders.potentialValue)}; {data.orders.cancelled} cancelado(s). Não entram automaticamente no valor pago.</p><p className="mt-2"><strong>Vendas reais:</strong> {data.sales.paidUnits} unidade(s) pagas. PENDING aparece em “Por receber”; OFFERED tem valor zero.</p><p className="mt-2"><strong>Histórico de visitas preservado:</strong> {data.migratedVisitDays} dia(s) existente(s) em DailySiteVisit foram incorporados pela migration sem duplicação.</p></section>

    {ranking ? <RankingModal ranking={ranking} data={data} range={range} search={stringParam(query.rankingSearch) ?? ""} page={Number(stringParam(query.rankingPage)) || 1} /> : null}
  </AdminShell>;
}
