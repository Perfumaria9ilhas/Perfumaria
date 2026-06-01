import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getAdminCustomersData } from "@/lib/data";

export default async function AdminClientesPage() {
  await requireAdmin();
  const customers = await getAdminCustomersData();

  return (
    <AdminShell
      title="Clientes"
      description="Lista de clientes que escolheram criar conta opcional na loja."
    >
      <section className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
        {customers.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--sand-soft)] px-5 py-10 text-center text-slate-500">
            Ainda não existem contas de clientes registadas.
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map((customer) => (
              <article
                key={customer.id}
                className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="font-serif text-3xl text-[color:var(--ink)]">
                      {customer.firstName} {customer.lastName}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">{customer.email}</p>
                    <p className="text-sm text-slate-600">{customer.phone}</p>
                  </div>
                  <p className="text-sm text-slate-500">
                    Registo em{" "}
                    {new Intl.DateTimeFormat("pt-PT", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(customer.createdAt)}
                  </p>
                </div>
                <div className="mt-4 rounded-[1.2rem] bg-white px-4 py-3 text-sm leading-7 text-slate-600">
                  {customer.address}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
