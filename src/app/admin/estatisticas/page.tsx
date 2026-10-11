import { AdminShell } from "@/components/admin/admin-shell";
import { StatisticsView } from "@/components/admin/statistics-view";
import { requireAdmin } from "@/lib/auth";
import { getStatisticsData, previousStatisticsRange, resolveStatisticsRange } from "@/lib/statistics";
import { statisticsOverview, statisticsSelection } from "@/lib/statistics-navigation";

export default async function AdminStatisticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const query = await searchParams;
  const param = (key: string) => typeof query[key] === "string" ? query[key] as string : undefined;
  const overview = statisticsOverview(resolveStatisticsRange({ period: param("period"), from: param("from"), to: param("to") }), param("anchor"));
  const selection = statisticsSelection(overview, param("day"), param("month"));
  const range = selection.range;
  const overviewPromise = getStatisticsData(overview);
  const [overviewData, data, previous] = await Promise.all([overviewPromise, range.from === overview.from && range.to === overview.to ? overviewPromise : getStatisticsData(range), getStatisticsData(previousStatisticsRange(range))]);
  return <AdminShell title="Estatísticas" description="Analisa o desempenho do negócio, produtos e comportamento no site.">
    <StatisticsView key={`${overview.period}:${overview.from}:${overview.to}:${range.from}:${range.to}`} data={data} previous={previous} overviewData={overviewData} overview={overview} selection={selection} />
  </AdminShell>;
}
