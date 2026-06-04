import { unstable_noStore as noStore } from "next/cache";
import { getAzoresDateKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export async function getCatalogData() {
  noStore();
  const [brands, categories, products] = await Promise.all([
    prisma.brand.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      include: {
        brand: true,
        category: true,
      },
      orderBy: [
        { bestseller: "desc" },
        { featured: "desc" },
        { updatedAt: "desc" },
        { name: "asc" },
      ],
    }),
  ]);

  return { brands, categories, products };
}

export async function getHomeData() {
  noStore();
  const [featuredProducts, reviews, productsCount, metrics, fallbackOrdersCount] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        OR: [{ featured: true }, { bestseller: true }],
      },
      include: {
        brand: true,
        category: true,
      },
      orderBy: [{ bestseller: "desc" }, { featured: "desc" }, { updatedAt: "desc" }],
      take: 18,
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
