import Link from "next/link";
import { AlertTriangle, ArrowRight, Box, ClipboardList, Euro, Plus, ShoppingCart } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/data";
import { formatPrice } from "@/lib/format";

function AttentionCard({ label, value, href, icon }: { label: string; value: number; href: string; icon: React.ReactNode }) {
  return <Link href={href} className="group flex min-h-28 min-w-0 flex-col items-center justify-center gap-1.5 rounded-[1.4rem] border border-[color:var(--line)] bg-white p-2 text-center transition hover:border-[color:var(--gold)] hover:shadow-sm sm:flex-row sm:justify-start sm:gap-3 sm:p-4 sm:text-left">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">{icon}</span>
    <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[color:var(--ink)] sm:text-sm">{label}</span><strong className="mt-0.5 block font-serif text-2xl text-[color:var(--ink)] sm:text-3xl">{value}</strong></span>
    <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 sm:block" />
  </Link>;
}

function StatusPill({ value }: { value: string }) {
  const positive = value === "Pago" || value === "Entregue";
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${positive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{value}</span>;
}

export default async function AdminPage() {
  await requireAdmin();
  const data = await getAdminDashboardData();

  return <AdminShell title="Dashboard" description="O seu centro de trabalho diário.">
    <section className="grid gap-3 sm:grid-cols-2">
      <Link href="/admin/stock?view=new-sale" className="flex min-h-24 items-center gap-4 rounded-[1.5rem] bg-[color:var(--gold)] px-5 py-4 text-white shadow-sm transition hover:bg-[color:var(--atlantic)]"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15"><Plus className="h-7 w-7" /></span><span><strong className="block text-lg">Nova venda</strong><span className="text-sm text-white/85">Registar uma nova venda</span></span></Link>
      <Link href="/admin/stock?view=sales&period=all" className="flex min-h-24 items-center gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-white px-5 py-4 shadow-sm transition hover:border-[color:var(--gold)]"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color:var(--line)]"><ClipboardList className="h-6 w-6 text-[color:var(--atlantic)]" /></span><span><strong className="block text-lg text-[color:var(--ink)]">Estado das vendas</strong><span className="text-sm text-slate-500">Ver e gerir todas as vendas</span></span></Link>
    </section>

    <section aria-label="Vendas de hoje" className="mt-4 grid grid-cols-2 gap-3">
      <article className="min-w-0 rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4"><p className="text-xs text-slate-600">Vendas hoje</p><strong className="mt-1 block font-serif text-2xl">{data.today.paidSales}</strong><p className="mt-1 text-xs text-slate-500">Vendas pagas registadas hoje</p></article>
      <article className="min-w-0 rounded-[1.4rem] border border-[color:var(--line)] bg-white p-4"><p className="text-xs text-slate-600">Faturação hoje</p><strong className="mt-1 block break-words font-serif text-2xl">{formatPrice(data.today.paidValue)}</strong><p className="mt-1 text-xs text-slate-500">Valor das vendas pagas · hora dos Açores</p></article>
    </section>

    <section className="mt-6"><h2 className="font-serif text-2xl text-[color:var(--ink)]">Pendentes e atenção</h2><div className="admin-attention-grid mt-3 grid grid-cols-1 gap-3">
      <AttentionCard label="Por pagar" value={data.attention.pendingPayments} href="/admin/stock?view=sales&period=all&payment=pending" icon={<Euro className="h-5 w-5" />} />
      <AttentionCard label="Por entregar" value={data.attention.pendingDeliveries} href="/admin/stock?view=sales&period=all&delivery=pending" icon={<Box className="h-5 w-5" />} />
      <AttentionCard label="Stock baixo" value={data.attention.lowStock} href="/admin/stock?view=stock&status=low" icon={<AlertTriangle className="h-5 w-5" />} />
    </div></section>

    <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)]">
      <section className="min-w-0"><div className="flex items-center justify-between gap-3"><h2 className="font-serif text-2xl text-[color:var(--ink)]">Vendas recentes</h2><Link href="/admin/stock?view=sales&period=all" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[color:var(--atlantic)]">Ver todas <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        <div className="mt-3 overflow-hidden rounded-[1.4rem] border border-[color:var(--line)] bg-white">
          {data.recentSales.length ? <>{data.recentSales.map((sale) => <Link key={sale.id} href="/admin/stock?view=sales&period=all" className="grid min-w-0 gap-2 border-b border-[color:var(--line)] px-4 py-3 last:border-b-0 hover:bg-[color:var(--sand-soft)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <span className="min-w-0"><strong className="block truncate text-sm text-[color:var(--ink)]">{sale.customerName || "Cliente não indicado"}</strong><span className="mt-0.5 block truncate text-xs text-slate-500">{sale.itemCount} {sale.itemCount === 1 ? "artigo" : "artigos"} · {sale.summary}</span></span>
            <strong className="text-sm text-[color:var(--ink)]">{formatPrice(sale.valueInCents)}</strong>
            <span className="flex flex-wrap gap-1.5"><StatusPill value={sale.payment} /><StatusPill value={sale.delivery} /></span>
          </Link>)}</> : <p className="p-5 text-sm text-slate-500">Ainda não existem vendas.</p>}
        </div>
      </section>

      <section className="min-w-0"><div className="flex items-center justify-between gap-3"><h2 className="font-serif text-2xl text-[color:var(--ink)]">Stock que precisa de atenção</h2><Link href="/admin/stock?view=stock" className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[color:var(--atlantic)]">Ver stock completo <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        <div className="mt-3 overflow-hidden rounded-[1.4rem] border border-[color:var(--line)] bg-white">
          {data.lowStockProducts.length ? data.lowStockProducts.map((product) => <Link key={product.id} href="/admin/stock?view=stock&status=low" className="flex min-w-0 items-center gap-3 border-b border-[color:var(--line)] px-4 py-3 last:border-b-0 hover:bg-[color:var(--sand-soft)]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--sand-soft)]"><ShoppingCart className="h-5 w-5 text-[color:var(--gold)]" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{product.name}</strong><span className="block truncate text-xs text-slate-500">{product.brand}</span></span><strong className="shrink-0 text-sm text-red-600">{product.stock}</strong><ArrowRight className="h-4 w-4 shrink-0 text-slate-400" /></Link>) : <p className="p-5 text-sm text-slate-500">Nenhum produto com stock baixo.</p>}
        </div>
      </section>
    </div>
  </AdminShell>;
}
