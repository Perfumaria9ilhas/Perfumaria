"use client";

import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";
import { buildMetaProductPayload, trackMetaEvent } from "@/lib/meta-pixel";
import { getProductAudienceLabel } from "@/lib/product-audience";
import {
  buildCartLineId,
  FIVE_ML_PRICE_IN_CENTS,
  TEN_ML_PRICE_IN_CENTS,
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
      className="object-contain p-3 transition duration-500 group-hover:scale-[1.03]"
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

    const result = addItem(
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

    if (result === "out-of-stock") {
      setFeedback(`Sem stock de momento para ${product.name}.`);
      return;
    }

    if (result === "limited") {
      setFeedback(`So existem ${product.stock} unidade(s) de ${product.name}.`);
      return;
    }

    setFeedback(`${product.name} ${getProductSizeLabel(size)} foi adicionado ao carrinho.`);
  }

  if (!visibleProducts.length) return null;

  return (
    <>
      {selectedProduct ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(43,30,18,0.55)] px-4 py-6"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="flex max-h-[88svh] w-full max-w-[32rem] flex-col overflow-hidden rounded-[1.55rem] border border-[color:var(--line)] bg-white shadow-[0_25px_80px_rgba(43,30,18,0.28)]"
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
              <h3 className="text-3xl text-[color:var(--ink)]">{selectedProduct.name}</h3>
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

              <div className="whitespace-pre-line text-sm leading-7 text-slate-600">
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

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
              {eyebrow}
            </p>
            <h2 className="text-[2rem] leading-tight text-[color:var(--ink)] sm:text-[2.7rem]">
              {title}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {description}
            </p>
          </div>

          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center rounded-full border border-[rgba(194,162,119,0.2)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--ink)] shadow-[0_10px_24px_rgba(95,71,49,0.05)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
          >
            {buttonLabel}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
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
                className="group relative flex h-full flex-col rounded-[1.5rem] border border-[rgba(194,162,119,0.16)] bg-[linear-gradient(180deg,_rgba(255,255,255,1),_rgba(252,246,238,0.96))] p-3 shadow-[0_14px_32px_rgba(95,71,49,0.06)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_42px_rgba(95,71,49,0.12)]"
              >
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="relative block aspect-square overflow-hidden rounded-[1.45rem] border border-[rgba(194,162,119,0.1)] bg-[linear-gradient(180deg,_#fffaf3,_#f3e8d8)]"
                >
                  <FeaturedProductImage imageUrl={product.imageUrl} name={product.name} />
                </button>

                <div className="mt-4 flex flex-1 flex-col">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--atlantic)]">
                    {product.brand.name}
                  </p>

                  <h3 className="mt-1.5 text-lg leading-tight text-[color:var(--ink)]">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--gold)]">
                    {audience}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setProductSize(product.id, "100ml")}
                      className={`rounded-md border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] transition ${
                        selectedSize === "100ml"
                          ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                          : "border-[color:var(--line)] bg-[color:var(--sand-soft)] text-slate-600"
                      }`}
                    >
                      Frasco Original 100ml
                    </button>

                    {product.availableInTenMl ? (
                      <button
                        type="button"
                        onClick={() => setProductSize(product.id, "10ml")}
                        className={`rounded-md border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] transition ${
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
                        className={`rounded-md border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] transition ${
                          selectedSize === "5ml"
                            ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                            : "border-[color:var(--line)] bg-[color:var(--sand-soft)] text-slate-600"
                        }`}
                      >
                        Decant 5ml
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    {hasDiscount ? (
                      <p className="text-xs text-slate-400 line-through">
                        {formatPrice(product.priceInCents)}
                      </p>
                    ) : null}
                    <p className="text-[1.5rem] leading-none text-[color:var(--ink)]">
                      {formatPrice(currentPrice)}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="inline-flex items-center justify-center rounded-full border border-[rgba(194,162,119,0.18)] bg-white px-4 py-2.5 text-xs font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                    >
                      Ver opções
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product, selectedSize)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_10px_18px_rgba(184,135,70,0.16)]"
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

        {feedback ? <p className="text-center text-sm text-[color:#8a623a]">{feedback}</p> : null}
      </section>
    </>
  );
}