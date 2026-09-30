"use client";

import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";
import { buildMetaProductPayload, trackMetaEvent } from "@/lib/meta-pixel";
import { trackInternalEvent } from "@/lib/internal-analytics";
import { getProductAudienceLabel } from "@/lib/product-audience";
import {
  buildCartLineId,
  FIVE_ML_PRICE_IN_CENTS,
  TEN_ML_PRICE_IN_CENTS,
  getProductBottleSizeLabel,
  getProductSizeLabel,
  type ProductSizeValue,
} from "@/lib/product-sizes";
import type { CatalogProduct } from "@/lib/types";

function FeaturedProductImage({
  imageUrl,
  name,
}: {
  imageUrl: string;
  name: string;
}) {
  if (!imageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white p-3">
        <Image
          src="/logo-9-ilhas.svg"
          alt="9 Ilhas Perfumaria"
          width={160}
          height={48}
          className="h-auto w-20 opacity-80"
        />
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={name}
      fill
      unoptimized
      className="object-contain p-3 transition duration-500 group-hover:scale-[1.025] sm:p-4"
    />
  );
}

type FeaturedProductsSliderProps = {
  products: CatalogProduct[];
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
};

export function FeaturedProductsSlider({
  products,
  eyebrow,
  title,
  description,
  buttonLabel,
}: FeaturedProductsSliderProps) {
  const { addItem } = useCart();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, ProductSizeValue>>({});
  const trackedViewContentId = useRef<string | null>(null);
  const trackedInternalViewId = useRef<string | null>(null);

  const selectedProductSize = selectedProduct
    ? selectedSizes[selectedProduct.id] ?? "100ml"
    : "100ml";

  const visibleProducts = useMemo(() => products.slice(0, 5), [products]);

  useEffect(() => {
    if (!feedback) return;

    const timer = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!selectedProduct) {
      trackedViewContentId.current = null;
      trackedInternalViewId.current = null;
      return;
    }

    if (trackedViewContentId.current !== selectedProduct.id) {
      trackedViewContentId.current = selectedProduct.id;

      trackMetaEvent(
        "ViewContent",
        buildMetaProductPayload({
          name: selectedProduct.name,
          brand: selectedProduct.brand.name,
          category: selectedProduct.category.name,
          value: getDisplayPrice(selectedProduct, selectedProductSize) / 100,
        }),
      );
    }

    if (trackedInternalViewId.current !== selectedProduct.id) {
      trackedInternalViewId.current = selectedProduct.id;
      trackInternalEvent({ event: "product_view", productId: selectedProduct.id });
    }
  }, [selectedProduct, selectedProductSize]);

  useEffect(() => {
    if (!selectedProduct) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedProduct]);

  function getSelectedSize(product: CatalogProduct) {
    return selectedSizes[product.id] ?? "100ml";
  }

  function setProductSize(productId: string, size: ProductSizeValue) {
    setSelectedSizes((current) => ({
      ...current,
      [productId]: size,
    }));
  }

  function getDisplayPrice(product: CatalogProduct, size: ProductSizeValue) {
    if (size === "5ml") return FIVE_ML_PRICE_IN_CENTS;
    if (size === "10ml") return TEN_ML_PRICE_IN_CENTS;

    return product.salePriceInCents && product.salePriceInCents < product.priceInCents
      ? product.salePriceInCents
      : product.priceInCents;
  }

  function handleAddToCart(product: CatalogProduct, size = getSelectedSize(product)) {
    const currentPrice = getDisplayPrice(product, size);

    addItem(
      {
        id: buildCartLineId(product.id, size),
        productId: product.id,
        name: product.name,
        brand: product.brand.name,
        sizeLabel: getProductSizeLabel(size),
        priceInCents: currentPrice,
        originalPriceInCents: size === "100ml" ? product.priceInCents : null,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
      1,
    );

    setFeedback(`${product.name} ${getProductSizeLabel(size)} foi adicionado ao carrinho.`);
  }

  if (!visibleProducts.length) return null;

  return (
    <>
      {selectedProduct ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[rgba(43,30,18,0.55)] p-2 sm:px-4 sm:py-6"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="flex max-h-[calc(100svh-1rem)] min-w-0 w-full max-w-[32rem] flex-col overflow-hidden rounded-[1.25rem] border border-[color:var(--line)] bg-white shadow-[0_25px_80px_rgba(43,30,18,0.28)] sm:max-h-[88svh] sm:rounded-[1.55rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-square shrink-0 bg-[radial-gradient(circle_at_top,_rgba(183,146,107,0.18),_transparent_55%),linear-gradient(180deg,_#fbf5ee,_#f1e6d8)]">
              <FeaturedProductImage imageUrl={selectedProduct.imageUrl} name={selectedProduct.name} />
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute right-3 top-3 rounded-full bg-white/92 px-3 py-2 text-xs font-semibold text-[color:var(--ink)] shadow-sm"
              >
                Fechar
              </button>
            </div>

            <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--atlantic)]">
                {selectedProduct.brand.name}
              </p>
              <h3 className="break-words text-2xl leading-tight text-[color:var(--ink)] sm:text-3xl">{selectedProduct.name}</h3>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--atlantic)]">
                {selectedProduct.category.name} · {getProductAudienceLabel(selectedProduct.audience)}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setProductSize(selectedProduct.id, "100ml")}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    selectedProductSize === "100ml"
                      ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                      : "border-[color:var(--line)] bg-[color:var(--sand-soft)] text-[color:var(--ink)]"
                  }`}
                >
                  100 ml
                </button>

                {selectedProduct.availableInTenMl ? (
                  <button
                    type="button"
                    onClick={() => setProductSize(selectedProduct.id, "10ml")}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      selectedProductSize === "10ml"
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                        : "border-[color:var(--line)] bg-[color:var(--sand-soft)] text-[color:var(--ink)]"
                    }`}
                  >
                    10 ml · {formatPrice(TEN_ML_PRICE_IN_CENTS)}
                  </button>
                ) : null}

                {selectedProduct.availableInFiveMl ? (
                  <button
                    type="button"
                    onClick={() => setProductSize(selectedProduct.id, "5ml")}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      selectedProductSize === "5ml"
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                        : "border-[color:var(--line)] bg-[color:var(--sand-soft)] text-[color:var(--ink)]"
                    }`}
                  >
                    5 ml · {formatPrice(FIVE_ML_PRICE_IN_CENTS)}
                  </button>
                ) : null}
              </div>

              <p className="text-2xl text-[color:var(--ink)]">
                {formatPrice(getDisplayPrice(selectedProduct, selectedProductSize))}
              </p>

              <div className="min-w-0 whitespace-pre-line break-words text-sm leading-7 text-slate-600 [overflow-wrap:anywhere]">
                {selectedProduct.description}
              </div>

              <button
                type="button"
                onClick={() => handleAddToCart(selectedProduct)}
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(184,135,70,0.22)]"
              >
                Adicionar ao carrinho
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="min-w-0 space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="text-[2rem] leading-tight text-[color:var(--ink)] sm:text-[2.7rem]">
              {title}
            </h2>
            <p className="hidden max-w-2xl text-sm leading-7 text-slate-600 sm:block sm:text-base">
              {description}
            </p>
          </div>

          <Link
            href="/catalogo"
            className="hidden items-center justify-center rounded-full border border-[rgba(194,162,119,0.2)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--ink)] shadow-[0_10px_24px_rgba(95,71,49,0.05)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] sm:inline-flex"
          >
            {buttonLabel}
          </Link>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-x-4 sm:gap-y-9 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-3 xl:grid-cols-5">
          {visibleProducts.map((product) => {
            const selectedSize = getSelectedSize(product);
            const currentPrice = getDisplayPrice(product, selectedSize);
            const audience = getProductAudienceLabel(product.audience);
            const hasDiscount =
              selectedSize === "100ml" &&
              product.salePriceInCents !== null &&
              product.salePriceInCents < product.priceInCents;

            return (
              <article
                key={product.id}
                className="group relative flex h-full w-[calc((100vw-3.5rem)/2)] min-w-[calc((100vw-3.5rem)/2)] snap-start flex-col sm:w-auto sm:min-w-0 sm:overflow-hidden sm:rounded-[1.1rem] sm:border sm:border-[rgba(194,162,119,0.14)] sm:bg-white sm:shadow-[0_3px_14px_rgba(95,71,49,0.045)] sm:transition sm:duration-300 sm:hover:-translate-y-0.5 sm:hover:border-[rgba(194,162,119,0.3)] sm:hover:shadow-[0_10px_24px_rgba(95,71,49,0.09)]"
              >
                <Link
                  href={`/catalogo?produto=${product.slug}`}
                  className="relative block aspect-[4/5] overflow-hidden bg-[color:#faf7f2] sm:h-[250px] sm:aspect-auto"
                >
                  <FeaturedProductImage imageUrl={product.imageUrl} name={product.name} />
                </Link>

                <div className="flex flex-1 flex-col pt-2 sm:p-4">
                  <p className="truncate text-[9px] font-medium uppercase tracking-[0.18em] text-[color:#7a624d] sm:text-[10px]">
                    {product.brand.name}
                  </p>

                  <h3 className="mt-1 line-clamp-2 min-h-[2.35rem] font-serif text-[0.98rem] leading-[1.18] text-[color:var(--ink)] sm:min-h-[2.8rem] sm:text-[1.16rem]">
                    <Link href={`/catalogo?produto=${product.slug}`}>{product.name}</Link>
                  </h3>

                  <p className="mt-1 hidden truncate text-[9px] uppercase tracking-[0.12em] text-slate-500 sm:block sm:text-[10px]">
                    {audience} · {selectedSize === "100ml" ? getProductBottleSizeLabel(product) : getProductSizeLabel(selectedSize)}
                  </p>

                  <div className="mt-3 hidden flex-nowrap gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex">
                    <button
                      type="button"
                      onClick={() => setProductSize(product.id, "100ml")}
                      className={`shrink-0 rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.06em] transition sm:text-[9px] ${
                        selectedSize === "100ml"
                          ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                          : "border-[color:var(--line)] bg-[color:var(--sand-soft)] text-slate-600"
                      }`}
                    >
                      {getProductBottleSizeLabel(product)}
                    </button>

                    {product.availableInTenMl ? (
                      <button
                        type="button"
                        onClick={() => setProductSize(product.id, "10ml")}
                        className={`shrink-0 rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.06em] transition sm:text-[9px] ${
                          selectedSize === "10ml"
                            ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                            : "border-[color:var(--line)] bg-[color:var(--sand-soft)] text-slate-600"
                        }`}
                      >
                        Decant 10ml
                      </button>
                    ) : null}

                    {product.availableInFiveMl ? (
                      <button
                        type="button"
                        onClick={() => setProductSize(product.id, "5ml")}
                        className={`shrink-0 rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.06em] transition sm:text-[9px] ${
                          selectedSize === "5ml"
                            ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                            : "border-[color:var(--line)] bg-[color:var(--sand-soft)] text-slate-600"
                        }`}
                      >
                        Decant 5ml
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-auto pt-3">
                    {hasDiscount ? (
                      <p className="text-xs text-slate-400 line-through">
                        {formatPrice(product.priceInCents)}
                      </p>
                    ) : null}
                    <p className="font-serif text-[1.18rem] leading-none text-[color:var(--ink)] sm:text-[1.3rem]">
                      {formatPrice(currentPrice)}
                    </p>
                  </div>

                  <div className="mt-3 hidden gap-1.5 sm:grid">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product, selectedSize)}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[color:var(--atlantic)] px-2 py-2 text-[10px] font-semibold text-white transition hover:bg-[color:var(--atlantic-deep)] sm:text-xs"
                    >
                      <Flame className="h-4 w-4" />
                      Comprar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex justify-end sm:hidden">
          <Link
            href="/catalogo"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--ink)]"
          >
            {buttonLabel}
          </Link>
        </div>

        {feedback ? <p className="text-center text-sm text-[color:#8a623a]">{feedback}</p> : null}
      </section>
    </>
  );
}
