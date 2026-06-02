import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requireAdmin();
  const [{ brands, categories, products, customers, orders, metrics, todayVisits, recentVisits }, wishesCount] =
    await Promise.all([getAdminDashboardData(), prisma.outOfStockWish.count()]);

  return (
    <AdminShell
      title="Dashboard"
      description="Visao geral rapida do catalogo, dos pedidos e do movimento diario da loja."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Marcas", value: brands.length },
          { label: "Categorias", value: categories.length },
          { label: "Produtos", value: products.length },
          { label: "Clientes", value: customers.length },
          { label: "Pedidos", value: orders.length },
          { label: "Clientes satisfeitos", value: metrics?.totalSatisfiedCustomers ?? orders.length },
          { label: "Visitas hoje", value: todayVisits?.visitCount ?? 0 },
          { label: "Desejos", value: wishesCount },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm"
          >
            <p className="text-sm uppercase tracking-[0.28em] text-[color:var(--atlantic)]">
              {item.label}
            </p>
            <h2 className="mt-3 font-serif text-5xl text-[color:var(--ink)]">{item.value}</h2>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
          <h3 className="font-serif text-3xl text-[color:var(--ink)]">Atalhos</h3>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/admin/marcas" className="rounded-full bg-[color:var(--sand-soft)] px-4 py-3 text-sm">
              Gerir marcas
            </Link>
            <Link href="/admin/categorias" className="rounded-full bg-[color:var(--sand-soft)] px-4 py-3 text-sm">
              Gerir categorias
            </Link>
            <Link href="/admin/produtos" className="rounded-full bg-[color:var(--atlantic)] px-4 py-3 text-sm font-semibold text-white">
              Gerir produtos
            </Link>
            <Link href="/admin/loja" className="rounded-full bg-[color:var(--sand-soft)] px-4 py-3 text-sm">
              Editar loja
            </Link>
            <Link href="/admin/clientes" className="rounded-full bg-[color:var(--sand-soft)] px-4 py-3 text-sm">
              Ver clientes
            </Link>
            <Link href="/admin/pedidos" className="rounded-full bg-[color:var(--sand-soft)] px-4 py-3 text-sm">
              Ver pedidos
            </Link>
            <Link href="/admin/desejos" className="rounded-full bg-[color:var(--sand-soft)] px-4 py-3 text-sm">
              Ver desejos
            </Link>
          </div>
        </article>

        <article className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
          <h3 className="font-serif text-3xl text-[color:var(--ink)]">Ultimos produtos</h3>
          <div className="mt-5 space-y-3">
            {products.slice(0, 5).map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-[1.3rem] bg-[color:var(--sand-soft)] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-[color:var(--ink)]">{product.name}</p>
                  <p className="text-sm text-slate-500">
                    {product.brand.name} . {product.category.name}
                  </p>
                </div>
                <span className="text-sm text-slate-500">Stock {product.stock}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6">
        <article className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-serif text-3xl text-[color:var(--ink)]">Visitas por dia</h3>
              <p className="text-sm text-slate-500">
                O contador do site reinicia a meia-noite, mas o historico fica guardado aqui.
              </p>
            </div>
            <p className="rounded-full bg-[color:var(--sand-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]">
              Hoje: {todayVisits?.visitCount ?? 0}
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {recentVisits.map((visit) => (
              <div
                key={visit.id}
                className="rounded-[1.3rem] bg-[color:var(--sand-soft)] px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--atlantic)]">
                  {visit.dateKey}
                </p>
                <p className="mt-2 font-serif text-3xl text-[color:var(--ink)]">
                  {visit.visitCount}
                </p>
                <p className="text-sm text-slate-500">visita(s)</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
