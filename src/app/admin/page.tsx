import Link from "next/link";
import { AlertTriangle, ArrowRight, Box, ClipboardList, Euro, Plus, TrendingUp, CalendarDays, ShoppingCart } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { DailyPerfumeCard } from "@/components/admin/daily-perfume-card";
import { getStoreSettings } from "@/lib/store-settings";
import { readHomepageState } from "@/lib/homepage-config";
import { isEligibleDailyPerfume } from "@/lib/daily-perfume";
import { getCatalogData, getAdminDashboardData } from "@/lib/data";
import { getAdminStockTableData } from "@/lib/stock-server";
import { StockAdminTable } from "@/components/admin/stock-admin-table";
import { DashboardStock } from "@/components/admin/dashboard-stock";
import { formatPrice } from "@/lib/format";

function AttentionCard({ label, value, href, icon }: { label: string; value: number; href: string; icon: React.ReactNode }) {
  return <Link href={href} className="group flex min-h-28 min-w-0 flex-col items-center justify-center gap-1.5 rounded-[1.4rem] border border-[color:var(--line)] bg-white p-2 text-center transition hover:border-[color:var(--gold)] hover:shadow-sm sm:flex-row sm:justify-start sm:gap-3 sm:p-4 sm:text-left">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">{icon}</span>
    <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[color:var(--ink)] sm:text-sm">{label}</span><strong className="mt-0.5 block font-serif text-2xl text-[color:var(--ink)] sm:text-3xl">{value}</strong></span>
    <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 sm:block" />
  </Link>;
}

export default async function AdminPage() {
  await requireAdmin();
  const [data, settings, catalog, stock] = await Promise.all([getAdminDashboardData(), getStoreSettings(), getCatalogData(), getAdminStockTableData()]);

  return <AdminShell title="Dashboard" description="O seu centro de trabalho diário.">
    <div className="admin-dashboard">
    <section className="admin-dashboard-actions grid gap-3 sm:grid-cols-2">
      <Link href="/admin/stock?view=new-sale" className="flex min-h-24 items-center gap-4 rounded-[1.5rem] bg-[color:var(--gold)] px-5 py-4 text-white shadow-sm transition hover:bg-[color:var(--atlantic)]"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15"><Plus className="h-7 w-7" /></span><span><strong className="block text-lg">Nova venda</strong><span className="text-sm text-white/85">Registar uma nova venda</span></span></Link>
      <Link href="/admin/stock?view=sales&period=all" className="flex min-h-24 items-center gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-white px-5 py-4 shadow-sm transition hover:border-[color:var(--gold)]"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color:var(--line)]"><ClipboardList className="h-6 w-6 text-[color:var(--atlantic)]" /></span><span><strong className="block text-lg text-[color:var(--ink)]">Estado das vendas</strong><span className="text-sm text-slate-500">Ver e gerir todas as vendas</span></span></Link>
    </section>

    <DailyPerfumeCard key={settings.updatedAt?.toISOString()} products={catalog.products.filter(isEligibleDailyPerfume).map(({id,name,imageUrl,priceInCents,stock,brand})=>({id,name,imageUrl,priceInCents,stock,brand}))} selectedId={readHomepageState(settings.homepageConfig).perfumeOfDayId} version={settings.updatedAt!.toISOString()} />

    <section className="admin-today mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Resumo de vendas">
      {[
        { label: "Vendas hoje", value: String(data.today.paidSales), href: "/admin/stock?view=sales&period=today&payment=paid", icon: ShoppingCart, note: "Vendas pagas" },
        { label: "Faturação hoje", value: formatPrice(data.today.paidValue), href: "/admin/stock?view=sales&period=today&payment=paid", icon: Euro, note: "Valor das vendas pagas" },
        { label: "Lucro estimado hoje", value: data.today.missingCost && !data.today.estimatedProfit ? "Incompleto" : formatPrice(data.today.estimatedProfit), href: "/admin/stock?view=sales&period=today&payment=paid", icon: TrendingUp, note: data.today.missingCost ? `Incompleto · ${data.today.missingCost} unidade(s) sem custo` : "Margem bruta estimada" },
        { label: "Vendas do mês", value: String(data.month.paidSales), href: "/admin/stock?view=sales&period=month&payment=paid", icon: CalendarDays, note: "Vendas pagas · Açores" },
      ].map(({ label, value, href, icon: Icon, note }) => <Link key={label} href={href} className="dashboard-metric min-w-0 rounded-2xl border bg-white p-3"><Icon size={20} className="mb-2 text-[color:var(--gold)]" /><span className="block text-xs text-slate-600">{label}</span><strong className="my-1 block break-words text-xl">{value}</strong><span className="block text-[10px] text-slate-500">{note}</span></Link>)}
    </section>

    <section className="mt-6"><h2 className="font-serif text-2xl text-[color:var(--ink)]">Pendentes e atenção</h2><div className="admin-attention-grid mt-3 grid grid-cols-1 gap-3">
      <AttentionCard label="Por pagar" value={data.attention.pendingPayments} href="/admin/stock?view=sales&period=all&payment=pending" icon={<Euro className="h-5 w-5" />} />
      <AttentionCard label="Por entregar" value={data.attention.pendingDeliveries} href="/admin/stock?view=sales&period=all&delivery=pending" icon={<Box className="h-5 w-5" />} />
      <AttentionCard label="Stock baixo" value={data.attention.lowStock} href="/admin/stock?view=stock&status=low" icon={<AlertTriangle className="h-5 w-5" />} />
    </div></section>

    <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
      <section className="min-w-0"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-serif text-xl">Vendas que exigem atenção</h2><Link href="/admin/stock?view=sales&period=all" className="shrink-0 text-xs underline">Ver todas</Link></div>
        <StockAdminTable rows={stock.rows} brands={stock.brands} categories={stock.categories} customerNames={stock.customerNames} customerSummaries={stock.customerSummaries} initialView="SALES" initialSalesPeriod="ALL" compact />
      </section>
      <DashboardStock rows={stock.rows.filter(row => row.active && row.stock > 0 && row.stock <= row.lowStockAlert).sort((a,b) => a.stock - b.stock || a.name.localeCompare(b.name, "pt")).slice(0,3)} />
    </div>
    </div>
  </AdminShell>;
}
