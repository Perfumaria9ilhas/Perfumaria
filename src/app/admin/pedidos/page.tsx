import { AdminShell } from "@/components/admin/admin-shell";
import { deleteOrder, updateOrderStatus } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getAdminOrdersData } from "@/lib/data";
import { formatPrice } from "@/lib/format";

export default async function AdminPedidosPage() {
  await requireAdmin();
  const orders = await getAdminOrdersData();
  const statuses = ["novo", "confirmado", "pago", "enviado", "entregue", "cancelado"] as const;

  return (
    <AdminShell
      title="Pedidos"
      description="Pedidos guardados automaticamente quando o cliente finaliza a seleção do site."
    >
      <section className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
        {orders.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--sand-soft)] px-5 py-10 text-center text-slate-500">
            Ainda não existem pedidos vindos do site.
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-[1.6rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--atlantic)]">
                      {order.reference}
                    </p>
                    <h2 className="mt-2 font-serif text-3xl text-[color:var(--ink)]">
                      Pedido {order.status}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Origem: {order.source}
                    </p>
                    {order.customerName || order.customerEmail || order.customerPhone ? (
                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        {order.customerName ? <p>Cliente: {order.customerName}</p> : null}
                        {order.customerEmail ? <p>Email: {order.customerEmail}</p> : null}
                        {order.customerPhone ? <p>Telefone: {order.customerPhone}</p> : null}
                        {order.customerAddress ? <p>Morada: {order.customerAddress}</p> : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">
                        Pedido feito sem conta iniciada.
                      </p>
                    )}
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-slate-500">
                      {new Intl.DateTimeFormat("pt-PT", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(order.createdAt)}
                    </p>
                    <p className="mt-2 font-serif text-3xl text-[color:var(--ink)]">
                      {formatPrice(order.totalInCents)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 md:justify-end">
                      <form action={updateOrderStatus} className="flex gap-2">
                        <input type="hidden" name="id" value={order.id} />
                        <select
                          name="status"
                          defaultValue={order.status}
                          className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm text-[color:var(--ink)]"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button className="rounded-full bg-[color:var(--atlantic)] px-4 py-2 text-sm font-semibold text-white">
                          Guardar
                        </button>
                      </form>
                      <form action={deleteOrder}>
                        <input type="hidden" name="id" value={order.id} />
                        <button
                          className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                          type="submit"
                        >
                          Apagar pedido
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-[1.2rem] bg-white px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-[color:var(--ink)]">{item.productName}</p>
                        <p className="text-sm text-slate-500">
                          {item.brandName} . {item.quantity} unidade(s)
                        </p>
                      </div>
                      <strong className="text-sm text-[color:var(--ink)]">
                        {formatPrice(item.lineTotalInCents)}
                      </strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
