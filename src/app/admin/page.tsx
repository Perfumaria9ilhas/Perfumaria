import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/data";
import { formatPrice } from "@/lib/format";

function OperationalCard({ label, value, detail, href, attention = false }: { label: string; value: string | number; detail?: string; href?: string; attention?: boolean }) {
  const content = <><p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--atlantic)]">{label}</p><p className="mt-2 break-words font-serif text-3xl text-[color:var(--ink)]">{value}</p>{detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}</>;
  const classes = `min-w-0 rounded-[1.5rem] border p-4 transition sm:p-5 ${attention ? "border-amber-200 bg-amber-50/60" : "border-[color:var(--line)] bg-white"} ${href ? "min-h-28 hover:border-[color:var(--gold)] hover:shadow-sm" : ""}`;
  return href ? <Link href={href} className={classes}>{content}</Link> : <article className={classes}>{content}</article>;
}

function formatAdminDate(value: Date) {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short", timeZone: "Atlantic/Azores" }).format(value);
}

export default async function AdminPage() {
  await requireAdmin();
  const data = await getAdminDashboardData();
  const tasks = [
    data.today.newOrders > 0 ? { label: `${data.today.newOrders} pedido${data.today.newOrders === 1 ? " novo" : "s novos"}`, href: "/admin/pedidos" } : null,
    data.attention.pendingPayments > 0 ? { label: `${data.attention.pendingPayments} pagamento${data.attention.pendingPayments === 1 ? " pendente" : "s pendentes"}`, href: "/admin/stock" } : null,
    data.attention.pendingDeliveries > 0 ? { label: `${data.attention.pendingDeliveries} entrega${data.attention.pendingDeliveries === 1 ? " pendente" : "s pendentes"}`, href: "/admin/stock" } : null,
    data.attention.outOfStock > 0 ? { label: `${data.attention.outOfStock} produto${data.attention.outOfStock === 1 ? " sem stock" : "s sem stock"}`, href: "/admin/stock" } : null,
    data.attention.lowStock > 0 ? { label: `${data.attention.lowStock} produto${data.attention.lowStock === 1 ? " com stock baixo" : "s com stock baixo"}`, href: "/admin/stock" } : null,
  ].filter((task): task is { label: string; href: string } => Boolean(task));

  return <AdminShell title="Dashboard" description="Centro de operações diário da Perfumaria 9 Ilhas.">
    <section><div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">Hoje</p><h2 className="mt-1 font-serif text-2xl text-[color:var(--ink)]">Movimento do dia</h2></div><p className="text-xs text-slate-500">Fuso horário dos Açores</p></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <OperationalCard label="Vendas pagas hoje" value={data.today.paidSales} />
      <OperationalCard label="Valor vendido hoje" value={formatPrice(data.today.paidValue)} />
      <OperationalCard label="Por receber" value={formatPrice(data.today.pendingValue)} detail="Total pendente atual" href="/admin/stock" attention={data.today.pendingValue > 0} />
      <OperationalCard label="Pedidos novos" value={data.today.newOrders} href="/admin/pedidos" attention={data.today.newOrders > 0} />
    </div></section>

    <section className="mt-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">Precisa de atenção</p><div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <OperationalCard label="Pagamentos pendentes" value={data.attention.pendingPayments} detail={`${formatPrice(data.today.pendingValue)} por receber`} href="/admin/stock" attention={data.attention.pendingPayments > 0} />
      <OperationalCard label="Entregas pendentes" value={data.attention.pendingDeliveries} href="/admin/stock" attention={data.attention.pendingDeliveries > 0} />
      <OperationalCard label="Stock baixo" value={`${data.attention.lowStock} produto${data.attention.lowStock === 1 ? "" : "s"}`} detail="Conforme o limite de cada produto" href="/admin/stock" attention={data.attention.lowStock > 0} />
      <OperationalCard label="Sem stock" value={`${data.attention.outOfStock} produto${data.attention.outOfStock === 1 ? "" : "s"}`} detail="Produtos ativos sem stock físico" href="/admin/stock" attention={data.attention.outOfStock > 0} />
    </div></section>

    <section className="mt-7 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4 sm:p-5"><h2 className="font-serif text-2xl text-[color:var(--ink)]">A tratar</h2>{tasks.length ? <ul className="mt-4 grid gap-2 sm:grid-cols-2">{tasks.map((task) => <li key={task.label}><Link href={task.href} className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-[color:var(--sand-soft)] px-4 py-3 text-sm hover:bg-[color:var(--sand)]"><span className="min-w-0 break-words">{task.label}</span><span aria-hidden="true">→</span></Link></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Nada pendente.</p>}</section>

    <section className="mt-7 grid gap-5 xl:grid-cols-2">
      <article className="min-w-0 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-serif text-2xl text-[color:var(--ink)]">Pedidos recentes</h2><Link href="/admin/pedidos" className="text-xs font-semibold text-[color:var(--atlantic)]">Ver pedidos</Link></div>{data.recentOrders.length ? <ul className="mt-4 space-y-2">{data.recentOrders.map((order) => <li key={order.id}><Link href="/admin/pedidos" className="grid min-w-0 gap-2 rounded-xl bg-[color:var(--sand-soft)] px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><p className="break-words text-sm font-semibold">{order.reference}</p><p className="mt-1 text-xs text-slate-500">{formatAdminDate(order.createdAt)} · {order._count.items} artigo(s){order.customerName ? ` · ${order.customerName}` : ""}</p></div><div className="flex items-center justify-between gap-3 sm:block sm:text-right"><span className="rounded-full bg-white px-2.5 py-1 text-xs capitalize">{order.status}</span><p className="mt-1 whitespace-nowrap text-sm font-semibold">{formatPrice(order.totalInCents)}</p></div></Link></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Ainda não existem pedidos.</p>}</article>

      <article className="min-w-0 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-serif text-2xl text-[color:var(--ink)]">Vendas recentes</h2><Link href="/admin/stock" className="text-xs font-semibold text-[color:var(--atlantic)]">Ver vendas</Link></div>{data.recentSales.length ? <ul className="mt-4 space-y-2">{data.recentSales.map((sale) => <li key={sale.id}><Link href="/admin/stock" className="block min-w-0 rounded-xl bg-[color:var(--sand-soft)] px-3 py-3"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-medium">{sale.summary}</p><p className="mt-1 text-xs text-slate-500">{formatAdminDate(sale.createdAt)}{sale.customerName ? ` · ${sale.customerName}` : ""}</p></div><strong className="shrink-0 whitespace-nowrap text-sm">{formatPrice(sale.valueInCents)}</strong></div><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white px-2.5 py-1">{sale.payment}</span><span className="rounded-full bg-white px-2.5 py-1">{sale.delivery}</span></div></Link></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Ainda não existem vendas.</p>}</article>
    </section>

    <section className="mt-7"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">Resumo da loja</p><h2 className="mt-1 font-serif text-2xl text-[color:var(--ink)]">Informação geral</h2></div><Link href="/admin/estatisticas" className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs font-semibold text-[color:var(--atlantic)] hover:border-[color:var(--gold)]">Ver estatísticas completas</Link></div><div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">{[
      ["Produtos", data.summary.products, "/admin/produtos"], ["Marcas", data.summary.brands, "/admin/marcas"], ["Categorias", data.summary.categories, "/admin/categorias"], ["Clientes", data.summary.customers, "/admin/clientes"], ["Pedidos", data.summary.orders, "/admin/pedidos"], ["Desejos", data.summary.wishes, "/admin/desejos"], ["Clientes satisfeitos", data.summary.satisfiedCustomers, null],
    ].map(([label, value, href]) => { const card = <><p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--atlantic)]">{label}</p><p className="mt-2 font-serif text-2xl text-[color:var(--ink)]">{value}</p></>; return href ? <Link key={label} href={String(href)} className="min-w-0 rounded-[1.25rem] border border-[color:var(--line)] bg-white p-3 hover:border-[color:var(--gold)]">{card}</Link> : <article key={label} className="min-w-0 rounded-[1.25rem] border border-[color:var(--line)] bg-white p-3">{card}</article>; })}</div></section>
  </AdminShell>;
}
