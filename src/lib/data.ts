import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import { getAzoresDateKey } from "@/lib/date";
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
  const todayKey = getAzoresDateKey();
  const [brands, categories, products, customers, orders, metrics, todayVisits, recentVisits] =
    await Promise.all([
      prisma.brand.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        include: {
          brand: true,
          category: true,
          productType: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.customerAccount.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.siteOrder.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.storeMetric.findUnique({
        where: { id: "main" },
        select: { totalSatisfiedCustomers: true },
      }),
      prisma.dailySiteVisit.findUnique({
        where: { dateKey: todayKey },
      }),
      prisma.dailySiteVisit.findMany({
        orderBy: { dateKey: "desc" },
        take: 7,
      }),
    ]);

  return {
    brands,
    categories,
    products,
    customers,
    orders,
    metrics,
    todayVisits,
    recentVisits,
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
