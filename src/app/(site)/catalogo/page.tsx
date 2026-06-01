import { CatalogClient } from "@/components/catalog/catalog-client";
import { getCatalogData } from "@/lib/data";
import { getStoreSettings } from "@/lib/store-settings";

export default async function CatalogoPage() {
  const [{ brands, products }, settings] = await Promise.all([
    getCatalogData(),
    getStoreSettings(),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-4 lg:px-5 lg:py-6">
      <div className="mb-8 max-w-4xl">
        <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
          Catálogo
        </p>
        <h1 className="mt-3 font-serif text-5xl text-[color:var(--ink)]">
          {settings.catalogTitle}
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">{settings.catalogIntro}</p>
      </div>
      <CatalogClient brands={brands} products={products} />
    </div>
  );
}
