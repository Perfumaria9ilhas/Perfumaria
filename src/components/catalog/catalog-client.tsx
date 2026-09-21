"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Clock3, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";
import { buildMetaProductPayload, trackMetaEvent } from "@/lib/meta-pixel";
import { getProductAudienceLabel } from "@/lib/product-audience";
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
  products: CatalogProduct[];
  whatsappNumber: string;
};

type SortOption = "recommended" | "price-asc" | "price-desc" | "recent";
const sortOptions: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recomendados" },
  { value: "price-asc", label: "Preço: mais baixo primeiro" },
  { value: "price-desc", label: "Preço: mais alto primeiro" },
  { value: "recent", label: "Mais recentes" },
];
type CatalogFilter = "Todos" | "Homem" | "Mulher" | "Unissexo" | "Decants" | "Kits" | "Corpo" | "Casa";

const catalogFilters: CatalogFilter[] = ["Todos", "Homem", "Mulher", "Unissexo", "Decants", "Kits", "Corpo", "Casa"];
const perfumeTypeSlugs = new Set(["edp", "edt", "parfum", "extrait", "elixir", "eau-de-parfum", "extrait-de-parfum", "oleo-perfumado"]);
const bodyTypeSlugs = new Set(["pasta-corporal", "body-mist", "all-over-spray", "desodorizante"]);

function matchesCatalogFilter(product: CatalogProduct, filter: CatalogFilter) {
  const type = product.productType.slug;
  const category = product.category.slug;
  if (filter === "Todos") return true;
  if (filter === "Kits") return type === "gift-set";
  if (filter === "Casa") return category === "ambientadores" || type === "ambientador";
  if (filter === "Corpo") return category === "cosmeticos" || category === "pasta-corporal" || bodyTypeSlugs.has(type);
  const isPerfume = category === "perfumes-arabes" && perfumeTypeSlugs.has(type);
  if (filter === "Decants") return isPerfume && (product.availableInFiveMl || product.availableInTenMl);
  return isPerfume && product.audience === ({ Homem: "MASCULINO", Mulher: "FEMININO", Unissexo: "UNISSEXO" }[filter]);
}

function getCatalogProductSize(product: CatalogProduct, filter: CatalogFilter, selectedSizes: Record<string, ProductSizeValue>): ProductSizeValue {
  if (filter === "Decants") {
    const chosen = selectedSizes[product.id];
    return chosen === "5ml" && product.availableInFiveMl || chosen === "10ml" && product.availableInTenMl
      ? chosen
      : product.availableInFiveMl ? "5ml" : "10ml";
  }
  return selectedSizes[product.id] ?? "100ml";
}

function getDisplayPrice(product: CatalogProduct, size: ProductSizeValue) {
  if (size === "5ml") return FIVE_ML_PRICE_IN_CENTS;
  if (size === "10ml") return TEN_ML_PRICE_IN_CENTS;
  return product.salePriceInCents && product.salePriceInCents < product.priceInCents
    ? product.salePriceInCents
    : product.priceInCents;
}

function getBottleSizeLabel(product: CatalogProduct) {
  const setSize = product.name.match(/\b(\d+)\s*[×x]\s*(\d+)\s*ml\b/i);
  if (setSize) return `${setSize[1]} × ${setSize[2]} ml`;
  const volume = product.name.match(/\b(\d+)\s*(ml|g)\b/i);
  return volume ? `${volume[1]} ${volume[2].toLowerCase()}` : "Frasco";
}

function getSelectedSizeLabel(product: CatalogProduct, size: ProductSizeValue) {
  return size === "100ml" ? getBottleSizeLabel(product) : getProductSizeLabel(size);
}

function ProductImage({
  src,
  alt,
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 25vw",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
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
      sizes={sizes}
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

export function CatalogClient({ products, whatsappNumber }: CatalogClientProps) {
  const { addItem } = useCart();
  const searchParams = useSearchParams();
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<CatalogFilter | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, ProductSizeValue>>({});
  const trackedViewContentId = useRef<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: "warning" | "success";
  } | null>(null);

  const filterFromQuery = useMemo(() => {
    const audienceParam = searchParams.get("audience")?.toUpperCase();
    return audienceParam === "MASCULINO" ? "Homem" : audienceParam === "FEMININO" ? "Mulher" : audienceParam === "UNISSEXO" ? "Unissexo" : "Todos";
  }, [searchParams]);
  const activeFilter = selectedFilter ?? filterFromQuery;
  const availableBrands = useMemo(() => [...new Map(products.map((product) => [product.brand.id, product.brand])).values()].sort((a, b) => a.name.localeCompare(b.name, "pt-PT")), [products]);

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
    ? getSelectedSize(selectedProduct)
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
      const matchesBrand = !selectedBrand || product.brandId === selectedBrand;
      const matchesCategory = matchesCatalogFilter(product, activeFilter);
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.brand.name.toLowerCase().includes(query);

      return matchesBrand && matchesCategory && matchesSearch;
    });

    if (sortBy === "recommended") {
      if (activeFilter !== "Todos") return result;
      return result.sort((left, right) =>
        left.brand.name.localeCompare(right.brand.name, "pt-PT", { sensitivity: "base" }) ||
        left.name.localeCompare(right.name, "pt-PT", { sensitivity: "base" }),
      );
    }

    return result.sort((left, right) => {
      if (sortBy === "recent") {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      const priceDifference = getDisplayPrice(left, getCatalogProductSize(left, activeFilter, selectedSizes)) - getDisplayPrice(right, getCatalogProductSize(right, activeFilter, selectedSizes));
      return sortBy === "price-asc" ? priceDifference : -priceDifference;
    });
  }, [activeFilter, products, search, selectedBrand, selectedSizes, sortBy]);

  function getSelectedSize(product: CatalogProduct) {
    return getCatalogProductSize(product, activeFilter, selectedSizes);
  }

  function setProductSize(productId: string, size: ProductSizeValue) {
    setSelectedSizes((current) => ({
      ...current,
      [productId]: size,
    }));
  }

  function buildCartItem(product: CatalogProduct, size: ProductSizeValue) {
    return {
      id: buildCartLineId(product.id, size),
      productId: product.id,
      name: product.name,
      brand: product.brand.name,
      sizeLabel: getSelectedSizeLabel(product, size),
      priceInCents: getDisplayPrice(product, size),
      originalPriceInCents: size === "100ml" ? product.priceInCents : null,
      imageUrl: product.imageUrl,
      stock: product.stock,
    };
  }

  async function handleAddToCart(product: CatalogProduct, size = getSelectedSize(product)) {
    if (product.stock <= 0) return;
    addItem(
      buildCartItem(product, size),
      1,
    );

    setToast({
      message: `${product.name} ${getSelectedSizeLabel(product, size)} foi adicionado ao carrinho.`,
      tone: "success",
    });
  }

  function getReservationUrl(product: CatalogProduct, size: ProductSizeValue) {
    const message = `Olá! Gostaria de reservar ${product.brand.name} ${product.name} (${getSelectedSizeLabel(product, size)}). Podem confirmar a disponibilidade?`;
    return `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
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
              <div className="relative h-48 overflow-hidden rounded-[1.1rem] bg-[radial-gradient(circle_at_top,_rgba(183,146,107,0.18),_transparent_58%),linear-gradient(180deg,_#fffaf3,_#f4e7d6)] sm:h-64">
                <ProductImage key={selectedProduct.id} src={selectedProduct.imageUrl} alt={selectedProduct.name} priority sizes="(max-width: 640px) 90vw, 480px" />
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
                {activeFilter !== "Decants" ? <button
                    type="button"
                    onClick={() => setProductSize(selectedProduct.id, "100ml")}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      selectedProductSize === "100ml"
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                        : "border-[color:var(--line)] bg-[color:var(--sand-soft)] text-[color:var(--ink)]"
                    }`}
                >
                  {getBottleSizeLabel(selectedProduct)}
                </button> : null}
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
              <p className={`text-sm font-semibold ${selectedProduct.stock > 0 ? "text-emerald-700" : "text-amber-700"}`}>
                {selectedProduct.stock > 0 ? "Em stock" : "Disponível por reserva"}
              </p>
              {selectedProduct.stock > 0 ? <button
                type="button"
                onClick={() => handleAddToCart(selectedProduct)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white"
              >
                Adicionar ao carrinho
              </button> : <a
                href={getReservationUrl(selectedProduct, selectedProductSize)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white"
              ><MessageCircle className="h-4 w-4" />Reservar</a>}
              <div className="space-y-1 text-xs leading-5 text-slate-600">
                <p>🚗 Entregas em mão na Ilha Terceira</p>
                <p>📦 Envios via CTT para Açores, Madeira e Portugal Continental</p>
              </div>
              <div className="whitespace-pre-line text-sm leading-7 text-slate-600">
                {selectedProduct.description}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-[1.6rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(253,248,241,0.98))] p-3 shadow-[0_14px_34px_rgba(92,68,47,0.07)] sm:p-4">
        <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar perfumes..."
              className="h-11 w-full rounded-full border border-[color:var(--line)] bg-white px-11 text-base outline-none transition focus:border-[color:var(--gold)] md:text-sm"
            />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filtrar por categoria">
          {catalogFilters.map((filter) => <button key={filter} type="button" onClick={() => setSelectedFilter(filter)} aria-pressed={activeFilter === filter} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition sm:text-sm ${activeFilter === filter ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white" : "border-[color:var(--line)] bg-white text-slate-700 hover:border-[color:var(--gold)]"}`}>{filter}</button>)}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="catalog-brand" className="shrink-0 text-sm font-medium text-slate-600">Marca</label>
          <select id="catalog-brand" value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)} className="h-10 min-w-0 max-w-xs flex-1 rounded-full border border-[color:var(--line)] bg-white px-4 text-sm outline-none focus:border-[color:var(--gold)]">
            <option value="">Todas as marcas</option>
            {availableBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className="shrink-0 text-sm font-medium text-slate-600">Ordenar por</span>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Ordenar produtos">
            {sortOptions.map((option) => <button key={option.value} type="button" onClick={() => setSortBy(option.value)} aria-pressed={sortBy === option.value} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition sm:text-sm ${sortBy === option.value ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white" : "border-[color:var(--line)] bg-white text-slate-700 hover:border-[color:var(--gold)]"}`}>{option.label}</button>)}
          </div>
        </div>
        <button
          type="button"
          className="mt-2 text-sm text-[color:var(--atlantic)] underline-offset-4 hover:underline"
          onClick={() => {
            setSelectedBrand("");
            setSelectedFilter("Todos");
            setSearch("");
            setSortBy("recommended");
          }}
        >
          Limpar filtros
        </button>
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
                    {activeFilter !== "Decants" ? <button
                      type="button"
                      onClick={() => setProductSize(product.id, "100ml")}
                      className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] transition ${
                        selectedSize === "100ml"
                          ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                          : "border-[color:var(--line)] bg-white text-slate-600 hover:border-[rgba(185,154,118,0.4)]"
                      }`}
                    >
                      {getBottleSizeLabel(product)}
                    </button> : null}
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

                  {product.stock > 0 ? <button
                    className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--atlantic)] px-3 text-[11px] font-semibold text-white transition hover:bg-[color:var(--atlantic-deep)] sm:min-h-[44px] sm:text-sm"
                    onClick={() => handleAddToCart(product, selectedSize)}
                    aria-label="Adicionar ao carrinho"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span className="md:hidden">Adicionar</span>
                    <span className="hidden md:inline">Adicionar ao carrinho</span>
                  </button> : <a
                    href={getReservationUrl(product, selectedSize)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--atlantic)] px-3 text-[11px] font-semibold text-white transition hover:bg-[color:var(--atlantic-deep)] sm:min-h-[44px] sm:text-sm"
                  ><MessageCircle className="h-4 w-4" />Reservar</a>}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
