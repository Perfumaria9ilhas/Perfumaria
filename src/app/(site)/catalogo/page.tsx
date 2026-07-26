import { CatalogClient } from "@/components/catalog/catalog-client";
import { getCatalogData } from "@/lib/data";

export default async function CatalogoPage() {
  const { brands, products } = await getCatalogData();

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-3 lg:px-5 lg:py-5">
      <div className="mb-5">
        <h1 className="font-serif text-[2rem] leading-none text-[color:var(--ink)] sm:text-[2.4rem] lg:text-[2.7rem]">
          Catálogo de Perfumes Árabes
        </h1>
      </div>
      <CatalogClient brands={brands} products={products} />
    </div>
  );
}
