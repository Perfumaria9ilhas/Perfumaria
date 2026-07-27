import { deleteProductType, saveProductType } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultProductTypes } from "@/lib/product-types";

export default async function AdminProductTypesPage() {
  await requireAdmin();
  await ensureDefaultProductTypes();

  const productTypes = await prisma.productType.findMany({
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <AdminShell
      title="Tipos de produto"
      description="Gerir os tipos usados no formulário dos produtos sem depender de opções fixas no código."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">Novo tipo</h2>
          <p className="mt-2 text-sm text-slate-500">
            Exemplos: EDP, EDT, Pasta Corporal, Ambientador, Gift Set ou Óleo
            Perfumado.
          </p>
          <form action={saveProductType} className="mt-6 space-y-4">
            <input
              name="name"
              placeholder="Nome do tipo de produto"
              className="h-12 w-full rounded-2xl border px-4"
              required
            />
            <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white">
              Guardar tipo
            </button>
          </form>
        </section>

        <section className="space-y-4">
          {productTypes.map((productType) => (
            <article
              key={productType.id}
              className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl text-[color:var(--ink)]">
                    {productType.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {productType._count.products} produto
                    {productType._count.products === 1 ? "" : "s"} a usar este tipo
                  </p>
                </div>
              </div>

              <form action={saveProductType} className="space-y-3">
                <input type="hidden" name="id" value={productType.id} />
                <input
                  name="name"
                  defaultValue={productType.name}
                  className="h-12 w-full rounded-2xl border px-4"
                  required
                />
                <button className="rounded-full bg-[color:var(--sand-soft)] px-5 py-3 text-sm font-medium text-[color:var(--ink)]">
                  Atualizar
                </button>
              </form>

              <form action={deleteProductType} className="mt-3">
                <input type="hidden" name="id" value={productType.id} />
                <button
                  className="text-sm text-red-500 disabled:cursor-not-allowed disabled:text-slate-300"
                  disabled={productType._count.products > 0}
                  title={
                    productType._count.products > 0
                      ? "Remove primeiro os produtos que usam este tipo."
                      : undefined
                  }
                >
                  Remover tipo
                </button>
              </form>
            </article>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}
