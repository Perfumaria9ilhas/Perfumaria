import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogClient } from "@/components/catalog/catalog-client";
import { getCatalogData, getCatalogProductBySlug } from "@/lib/data";
import { getProductBottleSizeLabel } from "@/lib/product-sizes";
import {
  buildPageMetadata,
  buildProductBreadcrumbJsonLd,
  buildProductJsonLd,
  buildProductListJsonLd,
  safeJsonLd,
} from "@/lib/seo";
import { getStoreSettings } from "@/lib/store-settings";

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getProductSlug(searchParams: Record<string, string | string[] | undefined>) {
  return typeof searchParams.produto === "string" ? searchParams.produto : null;
}

function getProductDescription(description: string) {
  const normalized = description.replace(/\s+/g, " ").trim();
  return normalized.length <= 155 ? normalized : `${normalized.slice(0, 152).trimEnd()}...`;
}

export async function generateMetadata({ searchParams }: CatalogPageProps): Promise<Metadata> {
  const query = await searchParams;
  const productSlug = getProductSlug(query);
  const settings = await getStoreSettings();

  if (productSlug) {
    const product = await getCatalogProductBySlug(productSlug);
    if (product) {
      const productPath = `/catalogo?produto=${encodeURIComponent(product.slug)}`;
      return buildPageMetadata({
        title: `${product.name} ${getProductBottleSizeLabel(product)} da ${product.brand.name}`,
        description: getProductDescription(product.description),
        path: productPath,
        imageUrl: product.imageUrl,
      });
    }
  }

  return buildPageMetadata({
    title: "Cat\u00e1logo de Perfumes \u00c1rabes",
    description:
      "Explore o cat\u00e1logo de perfumes \u00e1rabes originais da Perfumaria 9 Ilhas, com entrega na Ilha Terceira e envios para A\u00e7ores, Madeira e Portugal Continental.",
    path: "/catalogo",
    imageUrl: settings.heroImageUrl,
  });
}

export default async function CatalogoPage({ searchParams }: CatalogPageProps) {
  const query = await searchParams;
  const productSlug = getProductSlug(query);
  const [{ products }, settings, selectedProduct] = await Promise.all([
    getCatalogData(),
    getStoreSettings(),
    productSlug ? getCatalogProductBySlug(productSlug) : Promise.resolve(null),
  ]);

  if (query.produto !== undefined && !selectedProduct) {
    notFound();
  }

  const productPath = selectedProduct
    ? `/catalogo?produto=${encodeURIComponent(selectedProduct.slug)}`
    : null;
  const catalogJsonLd = buildProductListJsonLd(
    products.slice(0, 20),
    settings.catalogTitle,
    "/catalogo",
  );

  return (
    <div className="mx-auto max-w-[1420px] px-4 py-3 sm:py-5 lg:px-6 lg:py-8">
      {!selectedProduct ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(catalogJsonLd) }}
        />
      ) : null}
      {selectedProduct && productPath ? (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(buildProductJsonLd(selectedProduct, productPath)) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(buildProductBreadcrumbJsonLd(selectedProduct.name, productPath)) }}
          />
        </>
      ) : null}

      <div className="mb-3 max-w-3xl space-y-1.5 sm:mb-10 sm:space-y-3">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)] sm:text-[10px] sm:tracking-[0.3em]">Perfumaria 9 Ilhas</p>
        <h1 className="font-serif text-[1.6rem] leading-[1.02] text-[color:var(--ink)] min-[390px]:text-[1.72rem] sm:text-[3rem] lg:text-[3.5rem]">
          {"Cat\u00e1logo de Perfumes \u00c1rabes"}
        </h1>
        <p className="hidden max-w-2xl text-[13px] leading-5 text-slate-600 sm:block sm:text-base sm:leading-7">
          {
            "Descubra perfumes \u00e1rabes originais com apoio pr\u00f3ximo a partir da Praia da Vit\u00f3ria, na Ilha Terceira. A Perfumaria 9 Ilhas entrega localmente e envia para A\u00e7ores, Madeira e Portugal Continental."
          }
        </p>
      </div>
      <CatalogClient products={products} whatsappNumber={settings.whatsappNumber} />
    </div>
  );
}
