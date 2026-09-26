import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let settingsUpdatedAt: Date | null = null;
  let activeProducts: { slug: string; updatedAt: Date }[] = [];

  try {
    const [settings, products] = await Promise.all([
      prisma.storeSettings.findUnique({
        where: { id: "main" },
        select: { updatedAt: true },
      }),
      prisma.product.findMany({
        where: { active: true },
        orderBy: { slug: "asc" },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    settingsUpdatedAt = settings?.updatedAt ?? null;
    activeProducts = products;
  } catch {
    settingsUpdatedAt = null;
    activeProducts = [];
  }

  const latestProductUpdatedAt = activeProducts.reduce<Date | null>(
    (latest, product) => !latest || product.updatedAt > latest ? product.updatedAt : latest,
    null,
  );
  const sharedUpdatedAt = latestProductUpdatedAt ?? settingsUpdatedAt ?? new Date();

  return [
    {
      url: SITE_URL,
      lastModified: sharedUpdatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/catalogo`,
      lastModified: sharedUpdatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/perfumes-arabes-acores`,
      lastModified: settingsUpdatedAt ?? sharedUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/sobre-nos`,
      lastModified: settingsUpdatedAt ?? sharedUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/condicoes`,
      lastModified: settingsUpdatedAt ?? sharedUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...activeProducts.map((product) => ({
      url: `${SITE_URL}/catalogo?produto=${encodeURIComponent(product.slug)}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
