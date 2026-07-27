import { prisma } from "@/lib/prisma";

export const defaultProductTypes = [
  { name: "EDP", slug: "edp" },
  { name: "EDT", slug: "edt" },
  { name: "Parfum", slug: "parfum" },
  { name: "Extrait", slug: "extrait" },
  { name: "Elixir", slug: "elixir" },
  { name: "Pasta Corporal", slug: "pasta-corporal" },
  { name: "Ambientador", slug: "ambientador" },
  { name: "Desodorizante", slug: "desodorizante" },
  { name: "Gift Set", slug: "gift-set" },
  { name: "Oleo Perfumado", slug: "oleo-perfumado" },
] as const;

export async function ensureDefaultProductTypes() {
  await Promise.all(
    defaultProductTypes.map((productType) =>
      prisma.productType.upsert({
        where: { slug: productType.slug },
        update: {
          name: productType.name,
        },
        create: {
          name: productType.name,
          slug: productType.slug,
        },
      }),
    ),
  );
}
