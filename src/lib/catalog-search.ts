import type { CatalogProduct } from "@/lib/types";

const audienceSearchTerms: Record<string, string> = {
  MASCULINO: "Homem Masculino",
  FEMININO: "Mulher Feminino",
  UNISSEXO: "Unissexo",
};

export function normalizeCatalogSearchText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-PT")
    .trim();
}

export function productMatchesCatalogSearch(product: CatalogProduct, search: string) {
  const query = normalizeCatalogSearchText(search);
  if (!query) return true;

  if (query.length === 1) {
    return normalizeCatalogSearchText(product.name).startsWith(query);
  }

  if (query.length === 2) {
    const shortSearchFields = normalizeCatalogSearchText(
      [product.name, product.brand.name].join(" "),
    );

    return shortSearchFields
      .split(/[^a-z0-9]+/)
      .some((word) => word.startsWith(query));
  }

  const searchableText = normalizeCatalogSearchText(
    [
      product.name,
      product.brand.name,
      product.inspiredBy,
      product.description,
      audienceSearchTerms[product.audience] ?? product.audience,
    ].join(" "),
  );

  return searchableText.includes(query);
}
