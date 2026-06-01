import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminWishesData } from "@/lib/data";

export default async function AdminDesejosPage() {
  await requireAdmin();
  const wishes = await getAdminWishesData();

  return (
    <AdminShell
      title="Desejos"
      description="Produtos sem stock que os clientes tentaram adicionar ao carrinho."
    >
      <section className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
        {wishes.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--sand-soft)] p-8 text-sm text-slate-600">
            Ainda não existem tentativas registadas em produtos sem stock.
          </div>
        ) : (
          <div className="space-y-3">
            {wishes.map((wish) => (
              <article
                key={wish.id}
                className="flex flex-col gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-serif text-2xl text-[color:var(--ink)]">
                    {wish.product.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {wish.product.brand.name} . stock atual {wish.product.stock}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--atlantic)]">
                    Tentativas
                  </p>
                  <p className="font-serif text-4xl text-[color:var(--ink)]">{wish.attempts}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
