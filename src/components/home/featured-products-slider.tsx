"use client";

import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";
import { getProductAudienceLabel } from "@/lib/product-audience";
import type { CatalogProduct } from "@/lib/types";

function chunkProducts(products: CatalogProduct[], size: number) {
  const chunks: CatalogProduct[][] = [];

  for (let index = 0; index < products.length; index += size) {
    chunks.push(products.slice(index, index + size));
  }

  return chunks;
}

export function FeaturedProductsSlider({
  products,
}: {
  products: CatalogProduct[];
}) {
  const { addItem } = useCart();
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const productGroups = useMemo(() => chunkProducts(products, 6), [products]);
  const currentGroup =
    productGroups.length > 0 ? productGroups[activeGroupIndex % productGroups.length] : [];

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);

    onResize();
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (productGroups.length <= 1 || isMobile) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveGroupIndex((current) => (current + 1) % productGroups.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [isMobile, productGroups.length]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  function handleAddToCart(product: CatalogProduct) {
    const currentPrice =
      product.salePriceInCents && product.salePriceInCents < product.priceInCents
        ? product.salePriceInCents
        : product.priceInCents;

    const result = addItem(
      {
        id: product.id,
        name: product.name,
        brand: product.brand.name,
        priceInCents: currentPrice,
        originalPriceInCents: product.priceInCents,
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

    setFeedback(`${product.name} foi adicionado ao carrinho.`);
  }

  if (!currentGroup.length) {
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
            className="w-full max-w-md overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-white shadow-[0_25px_80px_rgba(43,30,18,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-square bg-[radial-gradient(circle_at_top,_rgba(183,146,107,0.18),_transparent_55%),linear-gradient(180deg,_#fbf5ee,_#f1e6d8)]">
              {selectedProduct.imageUrl ? (
                <Image
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/60 p-4">
                  <Image
                    src="/logo-9-ilhas.svg"
                    alt="9 Ilhas Perfumaria"
                    width={150}
                    height={40}
                    className="h-auto w-24 opacity-80"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute right-3 top-3 rounded-full bg-white/92 px-3 py-2 text-xs font-semibold text-[color:var(--ink)] shadow-sm"
              >
                Fechar
              </button>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--atlantic)]">
                {selectedProduct.brand.name}
              </p>
              <h3 className="font-serif text-3xl text-[color:var(--ink)]">
                {selectedProduct.name}
              </h3>
              <p className="text-sm font-semibold text-[color:var(--ink)]">
                {formatPrice(
                  selectedProduct.salePriceInCents &&
                    selectedProduct.salePriceInCents < selectedProduct.priceInCents
                    ? selectedProduct.salePriceInCents
                    : selectedProduct.priceInCents,
                )}
              </p>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--atlantic)]">
                {selectedProduct.category.name} · {getProductAudienceLabel(selectedProduct.audience)}
              </p>
              <p className="text-sm leading-7 text-slate-600">
                {selectedProduct.description}
              </p>
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

      <section className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(181,151,115,0.26)] bg-[radial-gradient(circle_at_top_left,_rgba(228,197,154,0.38),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(146,111,79,0.18),_transparent_34%),linear-gradient(180deg,_#fbf6ef,_#efe1cc)] p-3 shadow-[0_16px_46px_rgba(74,51,32,0.09)] lg:p-4.5">
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,_rgba(255,255,255,0.38),_transparent)]" />

        <div className="relative mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--atlantic)]">
              Perfumes em Destaque
            </p>
          </div>
          <Link
            href="/catalogo"
            className="rounded-full border border-[rgba(171,140,105,0.35)] bg-white/75 px-4 py-2 text-sm font-medium text-[color:var(--ink)] backdrop-blur"
          >
            Ver catálogo
          </Link>
        </div>

        <div
          className={
            isMobile
              ? "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
          }
        >
          {(isMobile ? products : currentGroup).map((product) => {
            const currentPrice =
              product.salePriceInCents && product.salePriceInCents < product.priceInCents
                ? product.salePriceInCents
                : product.priceInCents;
            const audience = getProductAudienceLabel(product.audience);

            return (
              <article
                key={product.id}
                className={`group relative overflow-hidden rounded-[1.2rem] border border-[rgba(181,151,115,0.2)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(248,238,225,0.92))] p-3 shadow-[0_10px_24px_rgba(74,51,32,0.07)] transition hover:translate-y-[-2px] hover:shadow-[0_16px_34px_rgba(74,51,32,0.1)] ${
                  isMobile ? "w-[48%] min-w-[48%] snap-start" : ""
                }`}
              >
                {product.bestseller ? (
                  <div className="absolute left-[-2.3rem] top-5 z-10 rotate-[-45deg] animate-pulse rounded-full bg-[linear-gradient(135deg,_#b3472d,_#df8a46)] px-10 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white shadow-[0_10px_22px_rgba(179,71,45,0.28)]">
                    Best seller
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  className="relative block w-full overflow-hidden rounded-[1rem] bg-[radial-gradient(circle_at_top,_rgba(183,146,107,0.16),_transparent_55%),linear-gradient(180deg,_#fbf5ee,_#f1e6d8)]"
                >
                  <div className="relative aspect-square">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/60 p-4">
                        <Image
                          src="/logo-9-ilhas.svg"
                          alt="9 Ilhas Perfumaria"
                          width={150}
                          height={40}
                          className="h-auto w-24 opacity-80"
                        />
                      </div>
                    )}
                  </div>
                </button>

                <div className="mt-3 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[rgba(173,147,114,0.2)] bg-white/78 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:#8f7d6b]">
                      {product.brand.name}
                    </span>
                    <span className="rounded-full bg-[rgba(215,191,160,0.28)] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:#8a623a]">
                      {audience}
                    </span>
                  </div>

                  <h3 className="min-h-[2.5rem] font-serif text-[1.15rem] leading-[1.05] text-[color:var(--ink)] md:min-h-[3.1rem] md:text-[1.35rem]">
                    {product.name}
                  </h3>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      {product.salePriceInCents &&
                      product.salePriceInCents < product.priceInCents ? (
                        <p className="text-xs text-[color:#b0a08f] line-through">
                          {formatPrice(product.priceInCents)}
                        </p>
                      ) : null}
                      <p className="font-serif text-[1.25rem] leading-none text-[color:var(--ink)] md:text-[1.55rem]">
                        {formatPrice(currentPrice)}
                      </p>
                    </div>
                    {product.salePriceInCents &&
                    product.salePriceInCents < product.priceInCents ? (
                      <span className="rounded-full bg-[rgba(179,71,45,0.1)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:#b3472d]">
                        Desconto
                      </span>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="inline-flex items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-3 py-2 text-sm font-bold text-white shadow-[0_10px_20px_rgba(184,135,70,0.24)] transition hover:translate-y-[-1px] md:px-4 md:py-2.5"
                    >
                      Ver detalhes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="inline-flex items-center justify-center gap-2 rounded-[0.9rem] border border-[rgba(210,180,140,0.9)] bg-[rgba(255,250,243,0.72)] px-3 py-2 text-sm font-semibold text-[color:#8a623a] transition hover:bg-white md:px-4 md:py-2.5"
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
          <p className="mt-5 text-center text-sm text-[color:#8a623a]">{feedback}</p>
        ) : null}

        {!isMobile && productGroups.length > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-2">
            {productGroups.map((group, index) => (
              <button
                key={group.map((product) => product.id).join("-")}
                type="button"
                onClick={() => setActiveGroupIndex(index)}
                aria-label={`Ver grupo ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeGroupIndex
                    ? "w-10 bg-[color:var(--gold)]"
                    : "w-2.5 bg-[rgba(166,133,96,0.34)]"
                }`}
              />
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
