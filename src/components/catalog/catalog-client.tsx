"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown, Search } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";
import { getProductAudienceLabel, productAudienceOptions, type ProductAudienceValue } from "@/lib/product-audience";
import type { CatalogProduct } from "@/lib/types";

type CatalogClientProps = {
  brands: { id: string; name: string }[];
  products: CatalogProduct[];
};

type SortOption = "price" | "name" | "brand";

function ProductImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/60 p-4">
        <Image
          src="/logo-9-ilhas.svg"
          alt="9 Ilhas Perfumaria"
          width={150}
          height={40}
          className="h-auto w-24 opacity-80"
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes="(max-width: 640px) 50vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 25vw"
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      onError={() => setHasError(true)}
    />
  );
}

function Toast({
  message,
  tone,
}: {
  message: string;
  tone: "warning" | "success";
}) {
  return (
    <div
      className={`fixed bottom-24 right-4 z-50 max-w-sm rounded-2xl px-5 py-4 text-sm shadow-xl md:bottom-6 md:right-6 ${
        tone === "warning"
          ? "bg-[color:var(--ink)] text-white"
          : "bg-[color:var(--atlantic)] text-white"
      }`}
    >
      {message}
    </div>
  );
}

export function CatalogClient({ brands, products }: CatalogClientProps) {
  const { addItem } = useCart();
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<ProductAudienceValue[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "warning" | "success";
  } | null>(null);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setFiltersOpen(true);
      }
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    const result = products.filter((product) => {
      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(product.brandId);
      const matchesAudience =
        selectedAudiences.length === 0 || selectedAudiences.includes(product.audience as ProductAudienceValue);
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.brand.name.toLowerCase().includes(query);

      return matchesBrand && matchesAudience && matchesSearch;
    });

    const priorityScore = (product: CatalogProduct) => {
      if (product.bestseller) {
        return 2;
      }

      if (product.featured) {
        return 1;
      }

      return 0;
    };

    return result.sort((left, right) => {
      const priorityDifference = priorityScore(right) - priorityScore(left);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      if (sortBy === "price") {
        const leftPrice =
          left.salePriceInCents && left.salePriceInCents < left.priceInCents
            ? left.salePriceInCents
            : left.priceInCents;
        const rightPrice =
          right.salePriceInCents && right.salePriceInCents < right.priceInCents
            ? right.salePriceInCents
            : right.priceInCents;

        return leftPrice - rightPrice;
      }

      if (sortBy === "brand") {
        return left.brand.name.localeCompare(right.brand.name, "pt");
      }

      return left.name.localeCompare(right.name, "pt");
    });
  }, [products, search, selectedAudiences, selectedBrands, sortBy]);

  function toggleBrand(brandId: string) {
    setSelectedBrands((current) =>
      current.includes(brandId)
        ? current.filter((item) => item !== brandId)
        : [...current, brandId],
    );
  }

  function toggleAudience(audience: ProductAudienceValue) {
    setSelectedAudiences((current) =>
      current.includes(audience)
        ? current.filter((item) => item !== audience)
        : [...current, audience],
    );
  }

  async function registerOutOfStockWish(productId: string) {
    try {
      await fetch("/api/out-of-stock-wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    } catch {
      // Ignore tracking failures so the cart flow is never blocked.
    }
  }

  async function handleAddToCart(product: CatalogProduct) {
    if (product.stock < 1) {
      await registerOutOfStockWish(product.id);
      setToast({
        message: `O perfume ${product.name} está sem stock neste momento.`,
        tone: "warning",
      });
      return;
    }

    const result = addItem(
      {
        id: product.id,
        name: product.name,
        brand: product.brand.name,
        priceInCents:
          product.salePriceInCents && product.salePriceInCents < product.priceInCents
            ? product.salePriceInCents
            : product.priceInCents,
        originalPriceInCents: product.priceInCents,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
      1,
    );

    if (result === "out-of-stock") {
      await registerOutOfStockWish(product.id);
      setToast({
        message: `O perfume ${product.name} está sem stock neste momento.`,
        tone: "warning",
      });
      return;
    }

    if (result === "limited") {
      setToast({
        message: `Só tens ${product.stock} unidade(s) disponíveis de ${product.name}.`,
        tone: "warning",
      });
      return;
    }

    setToast({
      message: `${product.name} foi adicionado ao carrinho.`,
      tone: "success",
    });
  }

  return (
    <div className="space-y-8">
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
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
              <ProductImage
                key={`modal-${selectedProduct.imageUrl || selectedProduct.id}`}
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
              />
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
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--atlantic)]">
                {selectedProduct.category.name} · {getProductAudienceLabel(selectedProduct.audience)}
              </p>
              <p className="text-sm leading-7 text-slate-600">
                {selectedProduct.description}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-[2.2rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.82),_rgba(253,248,241,0.96))] p-6 shadow-[0_20px_60px_rgba(92,68,47,0.08)]">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--atlantic)]">
              Filtrar por marca
            </p>
            <h2 className="font-serif text-3xl text-[color:var(--ink)]">
              Perfumes disponíveis
            </h2>
          </div>
          {isMobile ? (
            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              className="inline-flex items-center justify-between rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-medium text-[color:var(--ink)]"
            >
              <span>{filtersOpen ? "Fechar filtros" : "Abrir filtros"}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
              />
            </button>
          ) : (
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar por perfume ou marca"
                className="h-12 w-full rounded-full border border-[color:var(--line)] bg-white px-11 text-sm outline-none transition focus:border-[color:var(--gold)]"
              />
            </div>
          )}
        </div>

        {!isMobile || filtersOpen ? (
          <>
            <div className="relative mb-5 w-full md:hidden">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar por perfume ou marca"
                className="h-12 w-full rounded-full border border-[color:var(--line)] bg-white px-11 text-sm outline-none transition focus:border-[color:var(--gold)]"
              />
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
              {brands.map((brand) => {
                const active = selectedBrands.includes(brand.id);

                return (
                  <label
                    key={brand.id}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${active ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white shadow-sm" : "border-[color:var(--line)] bg-white text-slate-600 hover:border-[color:var(--gold)]/60"}`}
                  >
                    <input
                      checked={active}
                      onChange={() => toggleBrand(brand.id)}
                      type="checkbox"
                      className="h-4 w-4 rounded border-[color:var(--line)]"
                    />
                    {brand.name}
                  </label>
                );
              })}
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
              {productAudienceOptions.map((audience) => {
                const active = selectedAudiences.includes(audience.value);

                return (
                  <label
                    key={audience.value}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${active ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white shadow-sm" : "border-[color:var(--line)] bg-white text-slate-600 hover:border-[color:var(--gold)]/60"}`}
                  >
                    <input
                      checked={active}
                      onChange={() => toggleAudience(audience.value)}
                      type="checkbox"
                      className="h-4 w-4 rounded border-[color:var(--line)]"
                    />
                    {audience.label}
                  </label>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-[color:var(--line)] pt-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Ordenar por</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  className="h-11 rounded-full border border-[color:var(--line)] bg-white px-4 text-sm outline-none"
                >
                  <option value="price">Preço</option>
                  <option value="name">Nome</option>
                  <option value="brand">Marca</option>
                </select>
              </div>
              <button
                className="text-left text-sm text-[color:var(--atlantic)] underline-offset-4 hover:underline"
                onClick={() => {
                  setSelectedBrands([]);
                  setSelectedAudiences([]);
                  setSearch("");
                  setSortBy("name");
                }}
              >
                Limpar filtros
              </button>
            </div>
          </>
        ) : null}
      </section>

      {filteredProducts.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-[color:var(--line)] bg-white/70 px-6 py-16 text-center text-slate-500">
          Nenhum produto encontrado com os filtros atuais.
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => {
          const outOfStock = product.stock < 1;
          const hasDiscount =
            product.salePriceInCents !== null &&
            product.salePriceInCents < product.priceInCents;
          const currentPrice = hasDiscount
            ? (product.salePriceInCents as number)
            : product.priceInCents;

          return (
            <article
              key={product.id}
              className="group relative flex h-full flex-col overflow-hidden rounded-[1.2rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_rgba(255,255,255,1),_rgba(253,248,241,0.92))] shadow-[0_10px_22px_rgba(92,68,47,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_34px_rgba(92,68,47,0.14)] sm:rounded-[1.8rem]"
            >
              {product.bestseller ? (
                <div className="pointer-events-none absolute left-[-2.85rem] top-4 z-20 rotate-[-45deg] border border-[rgba(255,240,219,0.35)] bg-[linear-gradient(135deg,_#9f4c2d,_#d47f42_58%,_#efb163)] px-14 py-2 text-[9px] font-bold uppercase tracking-[0.32em] text-white shadow-[0_14px_28px_rgba(159,76,45,0.32)] animate-pulse sm:left-[-2.5rem] sm:top-5 sm:px-16 sm:text-[10px]">
                  Best seller
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setSelectedProduct(product)}
                className="relative aspect-square bg-[radial-gradient(circle_at_top,_rgba(183,146,107,0.18),_transparent_55%),linear-gradient(180deg,_#fbf5ee,_#f1e6d8)] text-left"
              >
                <div className="relative h-full w-full overflow-hidden">
                  <ProductImage key={product.imageUrl || product.id} src={product.imageUrl} alt={product.name} />
                </div>
              </button>

              <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
                <h3 className="line-clamp-2 min-h-[2.4rem] font-serif text-[0.98rem] leading-tight text-[color:var(--ink)] sm:min-h-0 sm:text-[1.45rem]">
                  {product.name}
                </h3>

                <p className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--atlantic)] sm:text-xs">
                  {getProductAudienceLabel(product.audience)}
                </p>

                <div className="mt-auto space-y-3">
                  <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                    <p className="font-serif text-lg text-[color:var(--ink)] sm:text-2xl">
                      {formatPrice(currentPrice)}
                    </p>
                    {hasDiscount ? (
                      <p className="text-[10px] text-slate-400 line-through sm:text-xs">
                        {formatPrice(product.priceInCents)}
                      </p>
                    ) : null}
                  </div>

                  <button
                    className={`w-full rounded-full px-3 py-2.5 text-xs font-semibold transition sm:py-3 sm:text-sm ${
                      outOfStock
                        ? "bg-[#efe7dd] text-[color:var(--ink)] hover:bg-[#e8dccb]"
                        : "bg-[color:var(--atlantic)] text-white hover:bg-[color:var(--atlantic-deep)]"
                    }`}
                    onClick={() => handleAddToCart(product)}
                  >
                    {outOfStock ? "Avisar interesse" : "Adicionar ao carrinho"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
