import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import { StockDeliveryStatus, StockMovementType, StockSaleStatus } from "@prisma/client";
import { summarizePaidSales } from "@/lib/admin-dashboard-sales";
import { getAzoresDateStart, getAzoresDateKey, getAzoresDayBounds } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { getAdminStockTableData } from "@/lib/stock-server";
import { getStoreSettings } from "@/lib/store-settings";
import { readHomepageState } from "@/lib/homepage-config";
import { applyDailyPerfume } from "@/lib/daily-perfume";

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
  const [product, settings] = await Promise.all([prisma.product.findFirst({
    where: { slug, active: true },
    select: publicProductSelect,
  }), getStoreSettings()]);
  return product ? applyDailyPerfume(product, readHomepageState(settings.homepageConfig).perfumeOfDayId) : null;
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
  const settings = await getStoreSettings();
  const dailyId = readHomepageState(settings.homepageConfig).perfumeOfDayId;
  const products = catalogRows.map(({ createdAt, ...product }) => {
    void createdAt;
    return {
      ...applyDailyPerfume(product, dailyId),
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
      select: publicProductSelect,
      take: 20,
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
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

  const settings = await getStoreSettings();
  const dailyId = readHomepageState(settings.homepageConfig).perfumeOfDayId;
  return {
    featuredProducts: featuredProducts.map((product) => applyDailyPerfume(product, dailyId)),
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
  const monthStart = getAzoresDateStart(getAzoresDateKey(new Date()).slice(0, 7) + "-01");
  const [activeProducts, monthSales, pendingSales, pendingDeliveries] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, select: { id: true, stock: true, lowStockAlert: true } }),
    prisma.stockMovement.findMany({ where: { type: StockMovementType.SALE, createdAt: { gte: monthStart, lt: end } }, select: { id: true, saleGroupId: true, saleStatus: true, quantity: true, saleUnitPriceInCents: true, unitCostInCents: true, reason: true, notes: true, createdAt: true, product: { select: { purchaseCostInCents: true, sizeLabel: true } } } }),
    prisma.stockMovement.findMany({ where: { type: StockMovementType.SALE, saleStatus: StockSaleStatus.PENDING }, select: { id: true, saleGroupId: true } }),
    prisma.stockMovement.findMany({ where: { type: StockMovementType.SALE, deliveryStatus: StockDeliveryStatus.PENDING }, select: { id: true, saleGroupId: true } }),
  ]);
  const groupCount = (items: { id: string; saleGroupId: string | null }[]) => new Set(items.map(item => item.saleGroupId ?? item.id)).size;
  return {
    today: summarizePaidSales(monthSales.filter(item => item.createdAt >= start)),
    month: summarizePaidSales(monthSales),
    attention: {
      pendingPayments: groupCount(pendingSales), pendingDeliveries: groupCount(pendingDeliveries),
      lowStock: activeProducts.filter(p => p.stock > 0 && p.stock <= p.lowStockAlert).length,
      outOfStock: activeProducts.filter(p => p.stock <= 0).length,
    },
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
