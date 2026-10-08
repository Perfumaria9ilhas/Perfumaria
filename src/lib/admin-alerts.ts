import { prisma } from "@/lib/prisma";

export async function getAdminAlerts() {
  const [products, payments, deliveries] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, select: { id: true, stock: true, lowStockAlert: true, updatedAt: true } }),
    prisma.stockMovement.findMany({ where: { type: "SALE", saleStatus: "PENDING" }, select: { id: true, saleGroupId: true, updatedAt: true } }),
    prisma.stockMovement.findMany({ where: { type: "SALE", deliveryStatus: "PENDING" }, select: { id: true, saleGroupId: true, updatedAt: true } }),
  ]);
  const groups = (items: typeof payments) => [...new Set(items.map(item => item.saleGroupId ?? item.id))].sort();
  const low = products.filter(p => p.stock > 0 && p.stock <= p.lowStockAlert);
  return [
    { category: "payments" as const, label: "Vendas por pagar", count: groups(payments).length, href: "/admin/stock?view=sales&period=all&payment=pending", fingerprint: payments.map(p => `${p.id}:${p.updatedAt.toISOString()}`).sort().join(",") },
    { category: "deliveries" as const, label: "Vendas por entregar", count: groups(deliveries).length, href: "/admin/stock?view=sales&period=all&delivery=pending", fingerprint: deliveries.map(p => `${p.id}:${p.updatedAt.toISOString()}`).sort().join(",") },
    { category: "stock" as const, label: "Produtos com stock baixo", count: low.length, href: "/admin/stock?view=stock&status=low", fingerprint: low.map(p => `${p.id}:${p.stock}:${p.updatedAt.toISOString()}`).sort().join(",") },
  ];
}
