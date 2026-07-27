import type { Metadata } from "next";
import { CatalogClient } from "@/components/catalog/catalog-client";
import { getCatalogData } from "@/lib/data";
import {
  buildPageMetadata,
  buildProductListJsonLd,
  safeJsonLd,
} from "@/lib/seo";
import { getStoreSettings } from "@/lib/store-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();

  return buildPageMetadata({
    title: "Cat\u00e1logo de Perfumes \u00c1rabes",
    description:
      "Explore o cat\u00e1logo de perfumes \u00e1rabes originais da Perfumaria 9 Ilhas, com entrega na Ilha Terceira e envios para A\u00e7ores, Madeira e Portugal Continental.",
    path: "/catalogo",
    imageUrl: settings.heroImageUrl,
  });
}

export default async function CatalogoPage() {
  const [{ brands, products }, settings] = await Promise.all([getCatalogData(), getStoreSettings()]);
  const catalogJsonLd = buildProductListJsonLd(
    products.slice(0, 20),
    settings.catalogTitle,
    "/catalogo",
  );

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-3 lg:px-5 lg:py-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(catalogJsonLd) }}
      />

      <div className="mb-5 space-y-3">
        <h1 className="font-serif text-[2rem] leading-none text-[color:var(--ink)] sm:text-[2.4rem] lg:text-[2.7rem]">
          {"Cat\u00e1logo de Perfumes \u00c1rabes"}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          {
            "Descubra perfumes \u00e1rabes originais com apoio pr\u00f3ximo a partir da Praia da Vit\u00f3ria, na Ilha Terceira. A Perfumaria 9 Ilhas entrega localmente e envia para A\u00e7ores, Madeira e Portugal Continental."
          }
        </p>
      </div>
      <CatalogClient brands={brands} products={products} />
    </div>
  );
}
