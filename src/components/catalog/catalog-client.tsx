"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, Clock3, Search, ShoppingBag, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";
import { buildMetaProductPayload, trackMetaEvent } from "@/lib/meta-pixel";
import { getProductAudienceLabel, productAudienceOptions, type ProductAudienceValue } from "@/lib/product-audience";
import { getProductConcentrationDetails } from "@/lib/product-concentration";
import {
  buildCartLineId,
  FIVE_ML_PRICE_IN_CENTS,
  TEN_ML_PRICE_IN_CENTS,
  getProductSizeLabel,
  type ProductSizeValue,
} from "@/lib/product-sizes";
import type { CatalogProduct } from "@/lib/types";

type CatalogClientProps = {
  brands: { id: string; name: string }[];
  products: CatalogProduct[];
};

type SortOption = "price" | "name" | "brand";

function ProductImage({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
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
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      sizes="(max-width: 640px) 50vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 25vw"
      className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-[1.04]"
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
  const searchParams = useSearchParams();
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<ProductAudienceValue[]>([]);
  const [hasTouchedAudienceFilter, setHasTouchedAudienceFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, ProductSizeValue>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const trackedViewContentId = useRef<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: "warning" | "success";
  } | null>(null);

  const audienceFromQuery = useMemo(() => {
    const audienceParam = searchParams.get("audience")?.toUpperCase();

    if (
      audienceParam === "MASCULINO" ||
      audienceParam === "FEMININO" ||
      audienceParam === "UNISSEXO"
    ) {
      return audienceParam as ProductAudienceValue;
    }

    return null;
  }, [searchParams]);

  const effectiveSelectedAudiences = useMemo(
    () =>
      hasTouchedAudienceFilter
        ? selectedAudiences
        : audienceFromQuery
          ? [audienceFromQuery]
          : selectedAudiences,
    [audienceFromQuery, hasTouchedAudienceFilter, selectedAudiences],
  );

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const selectedConcentration = getProductConcentrationDetails(
    selectedProduct?.productType?.name ?? selectedProduct?.concentration ?? "EDP",
  );
  const selectedProductSize = selectedProduct
    ? selectedSizes[selectedProduct.id] ?? "100ml"
    : "100ml";

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
    if (!selectedProduct) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedProduct]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    const result = products.filter((product) => {
      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(product.brandId);
      const matchesAudience =
        effectiveSelectedAudiences.length === 0 ||
        effectiveSelectedAudiences.includes(product.audience as ProductAudienceValue);
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.brand.name.toLowerCase().includes(query);

      return matchesBrand && matchesAudience && matchesSearch;
    });

    return result.sort((left, right) => {
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
  }, [effectiveSelectedAudiences, products, search, selectedBrands, sortBy]);

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

    if (size === "10ml") {
      return TEN_ML_PRICE_IN_CENTS;
    }

    return product.salePriceInCents && product.salePriceInCents < product.priceInCents
      ? product.salePriceInCents
      : product.priceInCents;
  }

  function buildCartItem(product: CatalogProduct, size: ProductSizeValue) {
    return {
      id: buildCartLineId(product.id, size),
      productId: product.id,
      name: product.name,
      brand: product.brand.name,
      sizeLabel: getProductSizeLabel(size),
      priceInCents: getDisplayPrice(product, size),
      originalPriceInCents: size === "100ml" ? product.priceInCents : null,
      imageUrl: product.imageUrl,
      stock: product.stock,
    };
  }

  function toggleBrand(brandId: string) {
    setSelectedBrands((current) =>
      current.includes(brandId)
        ? current.filter((item) => item !== brandId)
        : [...current, brandId],
    );
  }

  function toggleAudience(audience: ProductAudienceValue) {
    setHasTouchedAudienceFilter(true);
    setSelectedAudiences((current) =>
      current.includes(audience)
        ? current.filter((item) => item !== audience)
        : [...current, audience],
    );
  }

  async function handleAddToCart(product: CatalogProduct, size = getSelectedSize(product)) {
    addItem(
      buildCartItem(product, size),
      1,
    );

    setToast({
      message: `${product.name} ${getProductSizeLabel(size)} foi adicionado ao carrinho.`,
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
            className="flex max-h-[88svh] w-full max-w-[32rem] flex-col overflow-hidden rounded-[1.55rem] border border-[color:var(--line)] bg-white shadow-[0_25px_80px_rgba(43,30,18,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--atlantic)]">
                    {selectedProduct.brand.name}
                  </p>
                  <h3 className="font-serif text-3xl text-[color:var(--ink)]">
                    {selectedProduct.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--line)] text-[color:var(--ink)]"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--atlantic)]">
                {selectedProduct.category.name} · {getProductAudienceLabel(selectedProduct.audience)}
              </p>
              {selectedProduct.inspiredBy ? (
                <p className="text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-[color:var(--ink)]">Inspirado em </span>
                  {selectedProduct.inspiredBy}
                </p>
              ) : null}
              <div className="rounded-[1.1rem] border border-[rgba(185,154,118,0.16)] bg-[rgba(255,250,243,0.76)] px-3 py-3">
                <p className="text-sm font-semibold text-[color:var(--ink)]">
                  {selectedConcentration.icon} {selectedConcentration.label}
                </p>
                {selectedConcentration.description ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--atlantic)]">
                    {selectedConcentration.description}
                  </p>
                ) : null}
                {selectedProduct.durationLabel ? (
                  <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                    <Clock3 className="h-3.5 w-3.5" />
                    {selectedProduct.durationLabel}
                  </p>
                ) : null}
              </div>
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
              <p className="font-serif text-2xl text-[color:var(--ink)]">
                {formatPrice(getDisplayPrice(selectedProduct, selectedProductSize))}
              </p>
              <div className="whitespace-pre-line text-sm leading-7 text-slate-600">
                {selectedProduct.description}
              </div>
              <button
                type="button"
                onClick={() => handleAddToCart(selectedProduct)}
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white"
              >
                Adicionar ao carrinho
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-[1.6rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(253,248,241,0.98))] p-3 shadow-[0_14px_34px_rgba(92,68,47,0.07)] sm:p-4">
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar perfumes..."
              className="h-11 w-full rounded-full border border-[color:var(--line)] bg-white px-11 text-base outline-none transition focus:border-[color:var(--gold)] md:text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[color:var(--gold)] bg-white px-4 text-sm font-semibold text-[color:var(--gold)] shadow-[0_8px_18px_rgba(185,154,118,0.08)]"
          >
            <span>Filtros</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {filtersOpen ? (
          <>
            <div className="mt-3 rounded-[1.2rem] border border-[rgba(185,154,118,0.18)] bg-white/90 p-3">
            <div className="mb-4 flex flex-wrap gap-2">
              {brands.map((brand) => {
                const active = selectedBrands.includes(brand.id);

                return (
                  <label
                    key={brand.id}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition sm:text-sm ${active ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white shadow-sm" : "border-[color:var(--line)] bg-white text-slate-600 hover:border-[color:var(--gold)]/60"}`}
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

            <div className="mb-4 flex flex-wrap gap-2">
              {productAudienceOptions.map((audience) => {
                const active = effectiveSelectedAudiences.includes(audience.value);

                return (
                  <label
                    key={audience.value}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition sm:text-sm ${active ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white shadow-sm" : "border-[color:var(--line)] bg-white text-slate-600 hover:border-[color:var(--gold)]/60"}`}
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

            <div className="flex flex-col gap-3 border-t border-[color:var(--line)] pt-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Ordenar por</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  className="h-10 rounded-full border border-[color:var(--line)] bg-white px-4 text-sm outline-none"
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
                  setHasTouchedAudienceFilter(true);
                  setSearch("");
                  setSortBy("name");
                }}
              >
                Limpar filtros
              </button>
            </div>
            </div>
          </>
        ) : null}
      </section>

      {filteredProducts.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-[color:var(--line)] bg-white/70 px-6 py-16 text-center text-slate-500">
          Nenhum produto encontrado com os filtros atuais.
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-[10px] md:grid-cols-3 md:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
        {filteredProducts.map((product, index) => {
          const selectedSize = getSelectedSize(product);
          const concentration = getProductConcentrationDetails(
            product.productType?.name ?? product.concentration,
          );
          const hasDiscount =
            product.salePriceInCents !== null &&
            product.salePriceInCents < product.priceInCents;
          const currentPrice = getDisplayPrice(product, selectedSize);
          const shouldPreloadImage = index < 8;
          const productBadge = product.bestseller
            ? "Mais vendido"
            : product.featured
              ? "Novo"
              : null;

          return (
            <article
              key={product.id}
              className="group relative flex h-full flex-col overflow-hidden rounded-[1.05rem] border border-[rgba(185,154,118,0.18)] bg-[linear-gradient(180deg,_rgba(255,255,255,1),_rgba(252,245,236,0.96))] shadow-[0_8px_18px_rgba(92,68,47,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(185,154,118,0.34)] hover:shadow-[0_16px_30px_rgba(92,68,47,0.14)] sm:rounded-[1.4rem]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-20 bg-[linear-gradient(180deg,_rgba(255,255,255,0.4),_transparent)]" />
              {productBadge ? (
                <div className="pointer-events-none absolute left-2 top-2 z-20 rounded-full bg-[linear-gradient(135deg,_#8d4026,_#c87239_56%,_#eab16d)] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_10px_20px_rgba(159,76,45,0.2)] sm:text-[10px]">
                  {productBadge}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setSelectedProduct(product)}
                className="relative h-[168px] bg-[radial-gradient(circle_at_top,_rgba(183,146,107,0.18),_transparent_58%),linear-gradient(180deg,_#fffaf3,_#f4e7d6)] text-left sm:h-[190px] md:h-[220px]"
              >
                <div className="relative h-full w-full overflow-hidden">
                  <ProductImage
                    key={product.imageUrl || product.id}
                    src={product.imageUrl}
                    alt={product.name}
                    priority={shouldPreloadImage}
                  />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-[linear-gradient(180deg,_transparent,_rgba(255,248,239,0.92))]" />
              </button>

              <div className="relative flex flex-1 flex-col gap-2 p-2.5 sm:p-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-[rgba(185,154,118,0.16)] bg-white/88 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[color:var(--atlantic)] sm:text-[10px]">
                      {product.brand.name}
                    </span>
                    <span className="rounded-full bg-[rgba(215,191,160,0.24)] px-2.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[color:#8a623a] sm:text-[10px]">
                      {getProductAudienceLabel(product.audience)}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 min-h-[2.5rem] font-serif text-[0.97rem] leading-[1.18] text-[color:var(--ink)] sm:min-h-0 sm:text-[1.18rem]">
                    {product.name}
                  </h3>

                  {product.inspiredBy ? (
                    <p className="line-clamp-2 text-[11px] leading-4 text-slate-600 sm:text-xs">
                      <span className="font-medium text-[color:var(--ink)]">Inspirado em </span>
                      {product.inspiredBy}
                    </p>
                  ) : null}

                  {product.durationLabel || concentration.label ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 sm:text-[11px]">
                      {product.durationLabel ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {product.durationLabel}
                        </span>
                      ) : null}
                      {concentration.label ? (
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden="true">{concentration.icon}</span>
                          {concentration.label}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="mt-auto space-y-2">
                  <div className="flex flex-nowrap gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                      type="button"
                      onClick={() => setProductSize(product.id, "100ml")}
                      className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] transition ${
                        selectedSize === "100ml"
                          ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                          : "border-[color:var(--line)] bg-white text-slate-600 hover:border-[rgba(185,154,118,0.4)]"
                      }`}
                    >
                      100 ml
                    </button>
                    {product.availableInTenMl ? (
                      <button
                        type="button"
                        onClick={() => setProductSize(product.id, "10ml")}
                        className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] transition ${
                          selectedSize === "10ml"
                            ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                            : "border-[color:var(--line)] bg-white text-slate-600 hover:border-[rgba(185,154,118,0.4)]"
                        }`}
                      >
                        10 ml
                      </button>
                    ) : null}
                    {product.availableInFiveMl ? (
                      <button
                        type="button"
                        onClick={() => setProductSize(product.id, "5ml")}
                        className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] transition ${
                          selectedSize === "5ml"
                            ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                            : "border-[color:var(--line)] bg-white text-slate-600 hover:border-[rgba(185,154,118,0.4)]"
                        }`}
                      >
                        5 ml
                      </button>
                    ) : null}
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[color:var(--atlantic)]">
                        Preço
                      </p>
                      <p className="font-serif text-[1.2rem] leading-none text-[color:var(--ink)] sm:text-[1.32rem]">
                        {formatPrice(currentPrice)}
                      </p>
                    </div>
                    {selectedSize === "100ml" && hasDiscount ? (
                      <p className="text-[10px] text-slate-400 line-through sm:text-xs">
                        {formatPrice(product.priceInCents)}
                      </p>
                    ) : null}
                  </div>

                  <button
                    className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--atlantic)] px-3 text-[11px] font-semibold text-white transition hover:bg-[color:var(--atlantic-deep)] sm:min-h-[44px] sm:text-sm"
                    onClick={() => handleAddToCart(product, selectedSize)}
                    aria-label="Adicionar ao carrinho"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span className="md:hidden">Adicionar</span>
                    <span className="hidden md:inline">Adicionar ao carrinho</span>
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
