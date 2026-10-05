import { AdminShell } from "@/components/admin/admin-shell";
import { StatisticsView } from "@/components/admin/statistics-view";
import { requireAdmin } from "@/lib/auth";
import { getStatisticsData, previousStatisticsRange, resolveStatisticsRange } from "@/lib/statistics";

export default async function AdminStatisticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const query = await searchParams;
  const param = (key: string) => typeof query[key] === "string" ? query[key] as string : undefined;
  const range = resolveStatisticsRange({ period: param("period"), from: param("from"), to: param("to") });
  const [data, previous] = await Promise.all([getStatisticsData(range), getStatisticsData(previousStatisticsRange(range))]);
  const initialTab = param("tab") === "site" ? "site" : param("tab") === "products" ? "products" : "sales";
  return <AdminShell title="Estatísticas" description="Analisa o desempenho do negócio, produtos e comportamento no site.">
    <StatisticsView key={`${range.period}:${range.from}:${range.to}`} data={data} previous={previous} range={range} initialTab={initialTab} />
  </AdminShell>;
}
