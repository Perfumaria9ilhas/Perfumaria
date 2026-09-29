import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import { StockDeliveryStatus, StockMovementType, StockSaleStatus } from "@prisma/client";
import { getAzoresDayBounds } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { getAdminStockTableData } from "@/lib/stock-server";

const publicProductSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  inspiredBy: true,
  durationLabel: true,
  sizeLabel: true,
  imageUrl: true,
  priceInCents: true,
  salePriceInCents: true,
  stock: true,
  audience: true,
  concentration: true,
  availableInFiveMl: true,
  availableInTenMl: true,
  featured: true,
  bestseller: true,
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  productType: { select: { name: true, slug: true } },
} as const;

export const getCatalogProductBySlug = cache(async (slug: string) => {
  noStore();
  return prisma.product.findFirst({
    where: { slug, active: true },
    select: publicProductSelect,
  });
});

export async function getCatalogData() {
  noStore();
  const catalogRows = await prisma.product.findMany({
    where: { active: true },
    select: {
      ...publicProductSelect,
      createdAt: true,
    },
    orderBy: [
      { bestseller: "desc" },
      { featured: "desc" },
      { updatedAt: "desc" },
      { name: "asc" },
    ],
  });

  const recentRankById = new Map(
    [...catalogRows]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((product, index) => [product.id, index]),
  );
  const products = catalogRows.map(({ createdAt, ...product }) => {
    void createdAt;
    return {
      ...product,
      recentRank: recentRankById.get(product.id) ?? catalogRows.length,
    };
  });

  return { products };
}

export async function getHomeData() {
  noStore();
  const [featuredProducts, reviews, productsCount, metrics, fallbackOrdersCount] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        homeFeatured: true,
      },
      include: {
        brand: true,
        category: true,
        productType: true,
      },
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
      take: 5,
    }),
    prisma.storeReview.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.product.count(),
    prisma.storeMetric.findUnique({
      where: { id: "main" },
      select: { totalSatisfiedCustomers: true },
    }),
    prisma.siteOrder.count({
      where: {
        status: {
          not: "cancelado",
        },
      },
    }),
  ]);

  return {
    featuredProducts,
    reviews,
    stats: {
      satisfiedCustomersCount: metrics?.totalSatisfiedCustomers ?? fallbackOrdersCount,
      productsCount,
      islandsLabel: "Açores",
    },
  };
}

export async function getAdminDashboardData() {
  noStore();
  const { start, end } = getAzoresDayBounds();
  const [brands, categories, products, activeProducts, customers, orders, newOrders, metrics, todaySales, pendingSales, pendingDeliveries, recentOrders, recentMovements, wishesCount] = await Promise.all([
    prisma.brand.count(), prisma.category.count(), prisma.product.count(),
    prisma.product.findMany({ where: { active: true }, select: { stock: true, lowStockAlert: true } }),
    prisma.customerAccount.count(), prisma.siteOrder.count(), prisma.siteOrder.count({ where: { status: "novo" } }),
    prisma.storeMetric.findUnique({ where: { id: "main" }, select: { totalSatisfiedCustomers: true } }),
    prisma.stockMovement.findMany({ where: { type: StockMovementType.SALE, createdAt: { gte: start, lt: end } }, select: { id: true, saleGroupId: true, saleStatus: true, quantity: true, saleUnitPriceInCents: true } }),
    prisma.stockMovement.findMany({ where: { type: StockMovementType.SALE, saleStatus: StockSaleStatus.PENDING }, select: { id: true, saleGroupId: true, quantity: true, saleUnitPriceInCents: true } }),
    prisma.stockMovement.findMany({ where: { type: StockMovementType.SALE, deliveryStatus: StockDeliveryStatus.PENDING }, select: { id: true, saleGroupId: true } }),
    prisma.siteOrder.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, reference: true, createdAt: true, totalInCents: true, status: true, customerName: true, _count: { select: { items: true } } } }),
    prisma.stockMovement.findMany({ where: { type: StockMovementType.SALE }, orderBy: { createdAt: "desc" }, take: 250, select: { id: true, saleGroupId: true, customerName: true, saleStatus: true, deliveryStatus: true, quantity: true, saleUnitPriceInCents: true, createdAt: true, product: { select: { name: true } } } }),
    prisma.outOfStockWish.count(),
  ]);

  const groupKey = (movement: { id: string; saleGroupId: string | null }) => movement.saleGroupId ?? movement.id;
  const todayGroups = new Map<string, typeof todaySales>();
  for (const movement of todaySales) todayGroups.set(groupKey(movement), [...(todayGroups.get(groupKey(movement)) ?? []), movement]);
  const paidTodayGroups = [...todayGroups.values()].filter((items) => !items.some((item) => item.saleStatus === StockSaleStatus.PENDING) && items.some((item) => (item.saleStatus ?? StockSaleStatus.PAID) === StockSaleStatus.PAID));
  const paidTodayValue = paidTodayGroups.flat().filter((item) => (item.saleStatus ?? StockSaleStatus.PAID) === StockSaleStatus.PAID).reduce((sum, item) => sum + item.quantity * (item.saleUnitPriceInCents ?? 0), 0);
  const pendingValue = pendingSales.reduce((sum, item) => sum + item.quantity * (item.saleUnitPriceInCents ?? 0), 0);
  const pendingPaymentGroups = new Set(pendingSales.map(groupKey)).size;
  const pendingDeliveryGroups = new Set(pendingDeliveries.map(groupKey)).size;
  const outOfStock = activeProducts.filter((product) => product.stock <= 0).length;
  const lowStock = activeProducts.filter((product) => product.stock > 0 && product.stock <= product.lowStockAlert).length;

  const recentGroupMap = new Map<string, typeof recentMovements>();
  for (const movement of recentMovements) {
    const key = groupKey(movement);
    if (!recentGroupMap.has(key) && recentGroupMap.size >= 5) continue;
    recentGroupMap.set(key, [...(recentGroupMap.get(key) ?? []), movement]);
  }
  const recentSales = [...recentGroupMap.entries()].map(([id, items]) => {
    const hasPending = items.some((item) => item.saleStatus === StockSaleStatus.PENDING);
    const hasPaid = items.some((item) => (item.saleStatus ?? StockSaleStatus.PAID) === StockSaleStatus.PAID);
    return {
      id, createdAt: items[0].createdAt, customerName: items[0].customerName,
      summary: items.slice(0, 3).map((item) => `${item.quantity}× ${item.product.name}`).join(", ") + (items.length > 3 ? ` +${items.length - 3}` : ""),
      valueInCents: items.filter((item) => item.saleStatus !== StockSaleStatus.OFFERED).reduce((sum, item) => sum + item.quantity * (item.saleUnitPriceInCents ?? 0), 0),
      payment: hasPending ? "Por pagar" : hasPaid ? "Pago" : "Oferecido",
      delivery: items.some((item) => item.deliveryStatus === StockDeliveryStatus.PENDING) ? "Por entregar" : "Entregue",
    };
  });

  return {
    today: { paidSales: paidTodayGroups.length, paidValue: paidTodayValue, pendingValue, newOrders },
    attention: { pendingPayments: pendingPaymentGroups, pendingDeliveries: pendingDeliveryGroups, lowStock, outOfStock },
    recentOrders, recentSales,
    summary: { brands, categories, products, customers, orders, wishes: wishesCount, satisfiedCustomers: metrics?.totalSatisfiedCustomers ?? orders },
  };
}

export async function getAdminWishesData() {
  noStore();
  return prisma.outOfStockWish.findMany({
    include: {
      product: {
        include: {
          brand: true,
        },
      },
    },
    orderBy: [{ attempts: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getAdminCustomersData() {
  noStore();
  return prisma.customerAccount.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminOrdersData() {
  noStore();
  return prisma.siteOrder.findMany({
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminReviewsData() {
  noStore();
  return prisma.storeReview.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminStockData() {
  const data = await getAdminStockTableData();
  return data.rows;
}
