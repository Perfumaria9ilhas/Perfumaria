import { NextRequest, NextResponse } from "next/server";
import { getCatalogData } from "@/lib/data";
import { productMatchesCatalogSearch } from "@/lib/catalog-search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query || query.length > 80) return NextResponse.json({ products: [] });

  const { products } = await getCatalogData();
  const matches = products
    .filter((product) => productMatchesCatalogSearch(product, query))
    .slice(0, 5)
    .map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      brand: product.brand.name,
      priceInCents:
        product.salePriceInCents && product.salePriceInCents < product.priceInCents
          ? product.salePriceInCents
          : product.priceInCents,
    }));

  return NextResponse.json({ products: matches });
}
