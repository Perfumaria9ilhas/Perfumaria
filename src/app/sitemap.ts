import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let settingsUpdatedAt: Date | null = null;
  let latestProductUpdatedAt: Date | null = null;

  try {
    const [settings, latestProduct] = await Promise.all([
      prisma.storeSettings.findUnique({
        where: { id: "main" },
        select: { updatedAt: true },
      }),
      prisma.product.findFirst({
        where: { active: true },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ]);

    settingsUpdatedAt = settings?.updatedAt ?? null;
    latestProductUpdatedAt = latestProduct?.updatedAt ?? null;
  } catch {
    settingsUpdatedAt = null;
    latestProductUpdatedAt = null;
  }

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
  ];
}
