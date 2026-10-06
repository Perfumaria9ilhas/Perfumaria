import type { CatalogProduct } from "@/lib/types";

export type StoreCollection = { key: string; label: string; href: string; imageUrl: string; kind: "category" | "type" | "decants"; slug: string };
export function getStoreCollections(products: CatalogProduct[]): StoreCollection[] {
  const result: StoreCollection[] = [];
  const categories = new Map(products.map((product) => [product.category.slug, product.category]));
  for (const category of categories.values()) {
    const product = products.find((entry) => entry.category.slug === category.slug)!;
    result.push({ key: `category:${category.slug}`, label: category.slug === "perfumes-arabes" ? "Perfumes" : category.name, href: `/catalogo?categoria=${encodeURIComponent(category.slug)}`, imageUrl: product.imageUrl, kind: "category", slug: category.slug });
  }
  const types = new Map(products.filter((product) => ["gift-set", "desodorizante", "all-over-spray", "body-mist"].includes(product.productType.slug)).map((product) => [product.productType.slug, product]));
  for (const product of types.values()) result.push({ key: `type:${product.productType.slug}`, label: product.productType.slug === "gift-set" ? "Kits" : product.productType.name, href: `/catalogo?tipo=${encodeURIComponent(product.productType.slug)}`, imageUrl: product.imageUrl, kind: "type", slug: product.productType.slug });
  const decant = products.find((product) => product.availableInFiveMl || product.availableInTenMl);
  if (decant) result.splice(Math.min(1, result.length), 0, { key: "decants", label: "Decants", href: "/catalogo?formato=decants", imageUrl: decant.imageUrl, kind: "decants", slug: "decants" });
  return result;
}
