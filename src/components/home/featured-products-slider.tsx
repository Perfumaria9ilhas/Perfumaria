"use client";

import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";
import { getProductAudienceLabel } from "@/lib/product-audience";
import {
  buildCartLineId,
  FIVE_ML_PRICE_IN_CENTS,
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
      <div className="flex h-full w-full items-center justify-center bg-white/60 p-4">
        <Image
          src="/logo-9-ilhas.svg"
          alt="9 Ilhas Perfumaria"
          width={160}
          height={48}
          className="h-auto w-24 opacity-80"
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
      className="object-contain p-4 transition duration-500 group-hover:scale-[1.04]"
    />
  );
}

export function FeaturedProductsSlider({
  products,
}: {
  products: CatalogProduct[];
}) {
  const { addItem } = useCart();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, ProductSizeValue>>({});

  const visibleProducts = useMemo(() => products.slice(0, 5), [products]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

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
    if (size === "5ml") {
      return FIVE_ML_PRICE_IN_CENTS;
    }

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
      setFeedback(`Só existem ${product.stock} unidade(s) de ${product.name}.`);
      return;
    }

    setFeedback(`${product.name} ${getProductSizeLabel(size)} foi adicionado ao carrinho.`);
  }

  if (!visibleProducts.length) {
    return null;
  }

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
              <h3 className="font-serif text-3xl text-[color:var(--ink)]">
                {selectedProduct.name}
              </h3>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--atlantic)]">
                {selectedProduct.category.name} · {getProductAudienceLabel(selectedProduct.audience)}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setProductSize(selectedProduct.id, "100ml")}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    getSelectedSize(selectedProduct) === "100ml"
                      ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                      : "border-[color:var(--line)] bg-[color:var(--sand-soft)] text-[color:var(--ink)]"
                  }`}
                >
                  100 ml
                </button>
                {selectedProduct.availableInFiveMl ? (
                  <button
                    type="button"
                    onClick={() => setProductSize(selectedProduct.id, "5ml")}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      getSelectedSize(selectedProduct) === "5ml"
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                        : "border-[color:var(--line)] bg-[color:var(--sand-soft)] text-[color:var(--ink)]"
                    }`}
                  >
                    5 ml · {formatPrice(FIVE_ML_PRICE_IN_CENTS)}
                  </button>
                ) : null}
              </div>
              <p className="font-serif text-2xl text-[color:var(--ink)]">
                {formatPrice(getDisplayPrice(selectedProduct, getSelectedSize(selectedProduct)))}
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

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--gold)]">
              Destaques
            </p>
            <h2 className="font-serif text-[2.25rem] leading-none text-[color:var(--ink)] sm:text-[2.8rem]">
              Perfumes em destaque
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="rounded-full border border-[rgba(194,162,119,0.2)] bg-white px-5 py-3 text-sm font-medium text-[color:var(--ink)] shadow-[0_10px_18px_rgba(78,55,34,0.04)]"
          >
            Ver catálogo
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.7rem] border border-[rgba(194,162,119,0.18)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,239,227,0.96))] p-4 shadow-[0_14px_28px_rgba(78,55,34,0.06)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_rgba(78,55,34,0.12)]"
              >
                {product.bestseller ? (
                  <div className="absolute left-[-2.25rem] top-4 z-20 rotate-[-45deg] rounded-full bg-[linear-gradient(135deg,_#b3472d,_#df8a46)] px-10 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-white shadow-[0_12px_24px_rgba(179,71,45,0.26)]">
                    Best seller
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="relative block aspect-[4/4.5] overflow-hidden rounded-[1.35rem] bg-[radial-gradient(circle_at_top,_rgba(183,146,107,0.16),_transparent_55%),linear-gradient(180deg,_#fffaf3,_#f2e4d2)]"
                >
                  <FeaturedProductImage imageUrl={product.imageUrl} name={product.name} />
                </button>

                <div className="mt-4 flex flex-1 flex-col">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[rgba(194,162,119,0.16)] bg-white/88 px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:var(--atlantic)]">
                      {product.brand.name}
                    </span>
                    <span className="rounded-full bg-[rgba(215,191,160,0.24)] px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:#8a623a]">
                      {audience}
                    </span>
                  </div>

                  <h3 className="mt-3 min-h-[4rem] font-serif text-[1.65rem] leading-[1.05] text-[color:var(--ink)]">
                    {product.name}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setProductSize(product.id, "100ml")}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                        selectedSize === "100ml"
                          ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                          : "border-[color:var(--line)] bg-white text-slate-600"
                      }`}
                    >
                      Frasco original 100ml
                    </button>
                    {product.availableInFiveMl ? (
                      <button
                        type="button"
                        onClick={() => setProductSize(product.id, "5ml")}
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition ${
                          selectedSize === "5ml"
                            ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                            : "border-[color:var(--line)] bg-white text-slate-600"
                        }`}
                      >
                        Decant 5ml
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      {hasDiscount ? (
                        <p className="text-xs text-slate-400 line-through">
                          {formatPrice(product.priceInCents)}
                        </p>
                      ) : null}
                      <p className="font-serif text-[1.65rem] leading-none text-[color:var(--ink)]">
                        {formatPrice(currentPrice)}
                      </p>
                    </div>
                    {hasDiscount ? (
                      <span className="rounded-full bg-[rgba(179,71,45,0.1)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:#b3472d]">
                        Desconto
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="inline-flex items-center justify-center rounded-full border border-[rgba(194,162,119,0.18)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                    >
                      Ver opções
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product, selectedSize)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(184,135,70,0.22)]"
                    >
                      <Flame className="h-4 w-4" />
                      Adicionar ao carrinho
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {feedback ? (
          <p className="text-center text-sm text-[color:#8a623a]">{feedback}</p>
        ) : null}
      </section>
    </>
  );
}
