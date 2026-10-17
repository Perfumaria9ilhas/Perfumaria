import type { SaleAccountView } from "./sale-accounts";
export function groupCustomerPendencies(sales: SaleAccountView[], now = Date.now()) {
  const groups = new Map<string, { key: string; name: string; outstanding: number; unpaidUnits: number; undelivered: number; oldest: string; old: boolean; sales: SaleAccountView[] }>();
  for (const sale of sales) {
    if (!sale.outstanding && !sale.undelivered) continue;
    const key = sale.customerName.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-PT");
    const customer = groups.get(key) ?? { key, name: sale.customerName, outstanding: 0, unpaidUnits: 0, undelivered: 0, oldest: sale.createdAt, old: false, sales: [] };
    customer.outstanding += sale.outstanding;
    // Unallocated payments never pay arbitrary articles. Units with an open allocation remain explicit.
    customer.unpaidUnits += sale.outstanding ? sale.items.filter(i => i.outstanding > 0).reduce((n, i) => n + i.quantity, 0) : 0;
    customer.undelivered += sale.undelivered;
    if (sale.createdAt < customer.oldest) customer.oldest = sale.createdAt;
    customer.old ||= now - new Date(sale.createdAt).getTime() > 7 * 86_400_000;
    customer.sales.push(sale); groups.set(key, customer);
  }
  return [...groups.values()].sort((a, b) => a.oldest.localeCompare(b.oldest));
}
