import { deleteCategory, saveCategory } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <AdminShell title="Categorias" description="Categorias Prisma reutilizadas no catálogo e no admin.">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">Nova categoria</h2>
          <form action={saveCategory} className="mt-6 space-y-4">
            <input name="name" placeholder="Nome da categoria" className="h-12 w-full rounded-2xl border px-4" required />
            <textarea name="description" placeholder="Descrição breve" className="min-h-28 w-full rounded-2xl border px-4 py-3" />
            <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white">
              Guardar categoria
            </button>
          </form>
        </section>
        <section className="space-y-4">
          {categories.map((category) => (
            <article key={category.id} className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
              <form action={saveCategory} className="space-y-3">
                <input type="hidden" name="id" value={category.id} />
                <input name="name" defaultValue={category.name} className="h-12 w-full rounded-2xl border px-4" required />
                <textarea name="description" defaultValue={category.description ?? ""} className="min-h-28 w-full rounded-2xl border px-4 py-3" />
                <button className="rounded-full bg-[color:var(--sand-soft)] px-5 py-3 text-sm font-medium text-[color:var(--ink)]">
                  Atualizar
                </button>
              </form>
              <form action={deleteCategory} className="mt-3">
                <input type="hidden" name="id" value={category.id} />
                <button className="text-sm text-red-500">Eliminar categoria</button>
              </form>
            </article>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}
