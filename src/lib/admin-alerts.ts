import { getSaleAccounts } from "./sale-accounts";
import { prisma } from "@/lib/prisma";

export async function getAdminAlerts() {
  const [products, sales] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, select: { id: true, stock: true, lowStockAlert: true, updatedAt: true } }),
    getSaleAccounts(),
  ]);
  const payments = sales.filter(s => s.outstanding > 0);
  const deliveries = sales.filter(s => s.undelivered > 0);
  const low = products.filter(p => p.stock > 0 && p.stock <= p.lowStockAlert);
  const out = products.filter(p => p.stock === 0);
  return [
    { category: "payments" as const, label: "Vendas por pagar", count: payments.length, href: "/admin/stock?view=sales&period=all&payment=pending", fingerprint: payments.map(p => `${p.id}:${p.version}`).sort().join(",") },
    { category: "deliveries" as const, label: "Vendas por entregar", count: deliveries.length, href: "/admin/stock?view=sales&period=all&delivery=pending", fingerprint: deliveries.map(p => `${p.id}:${p.version}`).sort().join(",") },
    { category: "out" as const, label: "Produtos sem stock", count: out.length, href: "/admin/stock?view=stock&status=out", fingerprint: out.map(p => `${p.id}:${p.updatedAt.toISOString()}`).sort().join(",") },
    { category: "stock" as const, label: "Produtos com stock baixo", count: low.length, href: "/admin/stock?view=stock&status=low", fingerprint: low.map(p => `${p.id}:${p.stock}:${p.updatedAt.toISOString()}`).sort().join(",") },
  ];
}
