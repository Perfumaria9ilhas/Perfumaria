import { deleteBrand, saveBrand } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminBrandsPage() {
  await requireAdmin();
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });

  return (
    <AdminShell title="Marcas" description="CRUD simples para as marcas do catálogo.">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">Nova marca</h2>
          <form action={saveBrand} className="mt-6 space-y-4">
            <input name="name" placeholder="Nome da marca" className="h-12 w-full rounded-2xl border px-4" required />
            <input name="origin" placeholder="Origem ou país" className="h-12 w-full rounded-2xl border px-4" />
            <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white">
              Guardar marca
            </button>
          </form>
        </section>
        <section className="space-y-4">
          {brands.map((brand) => (
            <article key={brand.id} className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
              <form action={saveBrand} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input type="hidden" name="id" value={brand.id} />
                <input name="name" defaultValue={brand.name} className="h-12 rounded-2xl border px-4" required />
                <input name="origin" defaultValue={brand.origin ?? ""} className="h-12 rounded-2xl border px-4" />
                <button className="rounded-full bg-[color:var(--sand-soft)] px-5 py-3 text-sm font-medium text-[color:var(--ink)]">
                  Atualizar
                </button>
              </form>
              <form action={deleteBrand} className="mt-3">
                <input type="hidden" name="id" value={brand.id} />
                <button className="text-sm text-red-500">Eliminar marca</button>
              </form>
            </article>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}
