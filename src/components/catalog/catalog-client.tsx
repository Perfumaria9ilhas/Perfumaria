"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock3, Gift, MapPin, MessageCircle, PackageCheck, Search, Share2, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";
import {
  normalizeCatalogSearchText,
  productMatchesCatalogSearch,
} from "@/lib/catalog-search";
import { buildMetaProductPayload, trackMetaEvent } from "@/lib/meta-pixel";
import { trackInternalEvent, trackInternalSearch } from "@/lib/internal-analytics";
import { getProductAudienceLabel } from "@/lib/product-audience";
import { getProductConcentrationDetails } from "@/lib/product-concentration";
import {
  buildCartLineId,
  getDecantPriceInCents,
  getProductBottleSizeLabel,
  getProductSizeLabel,
  type ProductSizeValue,
} from "@/lib/product-sizes";
import type { CatalogProduct } from "@/lib/types";

type CatalogClientProps = {
  products: CatalogProduct[];
  whatsappNumber: string;
};

const INITIAL_VISIBLE_PRODUCTS = 24;

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

function getBottlePrice(product: CatalogProduct) {
  return product.salePriceInCents && product.salePriceInCents < product.priceInCents
    ? product.salePriceInCents
    : product.priceInCents;
}

function getDisplayPrice(product: CatalogProduct, size: ProductSizeValue) {
  if (size === "5ml" || size === "10ml") return getDecantPriceInCents(getBottlePrice(product), size);
  return getBottlePrice(product);
}

function getSelectedSizeLabel(product: CatalogProduct, size: ProductSizeValue) {
  return size === "100ml" ? getProductBottleSizeLabel(product) : getProductSizeLabel(size);
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
  const [hasLoaded, setHasLoaded] = useState(false);

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
    <>
      {!hasLoaded ? <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#f8f5f0,#eee8df)]"><Image src="/logo-9-ilhas.svg" alt="" width={120} height={36} className="h-auto w-20 opacity-20" /></div> : null}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        sizes={sizes}
        className={`h-full w-full object-contain p-3 transition duration-500 group-hover:scale-[1.025] sm:p-4 ${hasLoaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setHasLoaded(true)}
        onError={() => setHasError(true)}
      />
    </>
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<CatalogFilter | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, ProductSizeValue>>({});
  const trackedViewContentId = useRef<string | null>(null);
  const trackedInternalViewId = useRef<string | null>(null);
  const lastTrackedSearch = useRef<string | null>(null);
  const mobileFiltersRef = useRef<HTMLDivElement>(null);
  const mobileFiltersCloseRef = useRef<HTMLButtonElement>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: "warning" | "success";
  } | null>(null);

  const filterFromQuery = useMemo(() => {
    const audienceParam = searchParams.get("audience")?.toUpperCase();
    return audienceParam === "MASCULINO" ? "Homem" : audienceParam === "FEMININO" ? "Mulher" : audienceParam === "UNISSEXO" ? "Unissexo" : "Todos";
  }, [searchParams]);
  const activeFilter = selectedFilter ?? filterFromQuery;
  const activeFilterCount = (activeFilter === "Todos" ? 0 : 1) + (selectedBrand ? 1 : 0);
  const availableBrands = useMemo(() => [...new Map(products.map((product) => [product.brand.id, product.brand])).values()].sort((a, b) => a.name.localeCompare(b.name, "pt-PT")), [products]);
  const selectedProductSlug = searchParams.get("produto");
  const selectedProduct = useMemo(
    () => products.find((product) => product.slug === selectedProductSlug) ?? null,
    [products, selectedProductSlug],
  );

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const scrollY = window.scrollY;
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    window.requestAnimationFrame(() => mobileFiltersCloseRef.current?.focus({ preventScroll: true }));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileFiltersOpen(false);
        return;
      }
      if (event.key !== "Tab" || !mobileFiltersRef.current) return;
      const focusable = Array.from(
        mobileFiltersRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo({ top: scrollY, behavior: "auto" });
    };
  }, [mobileFiltersOpen]);

  const selectedConcentration = getProductConcentrationDetails(
    selectedProduct?.productType?.name ?? selectedProduct?.concentration ?? "EDP",
  );
  const selectedProductSize = selectedProduct
    ? selectedSizes[selectedProduct.id] ?? "100ml"
    : "100ml";
  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];

    return products
      .filter(
        (product) =>
          product.id !== selectedProduct.id &&
          product.audience === selectedProduct.audience,
      )
      .sort((left, right) => {
        const leftSameBrand = left.brand.id === selectedProduct.brand.id ? 0 : 1;
        const rightSameBrand = right.brand.id === selectedProduct.brand.id ? 0 : 1;
        return (
          leftSameBrand - rightSameBrand ||
          left.brand.name.localeCompare(right.brand.name, "pt-PT", { sensitivity: "base" }) ||
          left.name.localeCompare(right.name, "pt-PT", { sensitivity: "base" })
        );
      })
      .slice(0, 3);
  }, [products, selectedProduct]);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const modalCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedProductSlug && !selectedProduct) {
      router.replace("/catalogo", { scroll: false });
    }
  }, [router, selectedProduct, selectedProductSlug]);

  useEffect(() => {
    if (!selectedProduct) return;
    window.requestAnimationFrame(() => {
      modalCloseRef.current?.focus({ preventScroll: true });
      modalContentRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.replace("/catalogo", { scroll: false });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, selectedProduct]);

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
    if (!selectedProduct) {
      return;
    }

    const scrollY = window.scrollY;
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo({ top: scrollY, behavior: "auto" });
    };
  }, [selectedProduct]);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesBrand = !selectedBrand || product.brand.id === selectedBrand;
      const matchesCategory = matchesCatalogFilter(product, activeFilter);
      const matchesSearch = productMatchesCatalogSearch(product, search);

      return matchesBrand && matchesCategory && matchesSearch;
    });

    if (sortBy === "recommended") {
      if (normalizeCatalogSearchText(search).length === 1) {
        return result.sort((left, right) =>
          left.name.localeCompare(right.name, "pt-PT", { sensitivity: "base" }),
        );
      }

      if (activeFilter !== "Todos") return result;
      return result.sort((left, right) =>
        left.brand.name.localeCompare(right.brand.name, "pt-PT", { sensitivity: "base" }) ||
        left.name.localeCompare(right.name, "pt-PT", { sensitivity: "base" }),
      );
    }

    return result.sort((left, right) => {
      if (sortBy === "recent") {
        return (left.recentRank ?? products.length) - (right.recentRank ?? products.length);
      }

      const priceDifference = getDisplayPrice(left, getCatalogProductSize(left, activeFilter, selectedSizes)) - getDisplayPrice(right, getCatalogProductSize(right, activeFilter, selectedSizes));
      return sortBy === "price-asc" ? priceDifference : -priceDifference;
    });
  }, [activeFilter, products, search, selectedBrand, selectedSizes, sortBy]);
  const hasActiveFilters =
    activeFilter !== "Todos" || Boolean(selectedBrand) || Boolean(search.trim()) || sortBy !== "recommended";

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  useEffect(() => {
    const normalized = normalizeCatalogSearchText(search).trim();
    if (normalized.length < 2 || normalized.length > 80) {
      lastTrackedSearch.current = null;
      return;
    }
    const interactionKey = `${normalized}|${activeFilter}|${selectedBrand}|${filteredProducts.length}`;
    if (lastTrackedSearch.current === interactionKey) return;
    const timer = window.setTimeout(() => {
      trackInternalSearch(search, filteredProducts.length);
      lastTrackedSearch.current = interactionKey;
    }, 850);
    return () => window.clearTimeout(timer);
  }, [activeFilter, filteredProducts.length, search, selectedBrand]);

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

  function prepareProductOpen(product: CatalogProduct) {
    setSelectedSizes((current) => ({ ...current, [product.id]: "100ml" }));
    window.requestAnimationFrame(() => {
      modalContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function closeProduct() {
    router.replace("/catalogo", { scroll: false });
  }

  async function shareProduct(product: CatalogProduct) {
    const url = `${window.location.origin}/catalogo?produto=${encodeURIComponent(product.slug)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.brand.name} ${product.name} | Perfumaria 9 Ilhas`,
          text: `${product.brand.name} ${product.name}`,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setToast({ message: "Link copiado", tone: "success" });
  }

  return (
    <div className="min-w-0 space-y-8 overflow-x-clip">
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
      {selectedProduct ? (
        <div
          className="fixed inset-0 z-50 flex h-[100dvh] min-h-[100svh] w-screen items-start justify-center overflow-hidden bg-white p-0 sm:items-center sm:bg-[rgba(25,20,17,0.68)] sm:px-4 sm:py-6 sm:backdrop-blur-[3px]"
          onClick={closeProduct}
        >
          <div
            className="flex h-[100dvh] min-h-[100svh] min-w-0 w-full max-w-[76rem] flex-col overflow-hidden bg-white shadow-[0_32px_100px_rgba(25,20,17,0.34)] sm:h-auto sm:min-h-0 sm:max-h-[92svh] sm:rounded-[1.5rem] sm:border sm:border-white/60"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-product-title"
          >
            <div ref={modalContentRef} className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-[calc(env(safe-area-inset-top)+1rem)] sm:p-6 lg:p-8">
              <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
                <button type="button" onClick={closeProduct} className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)] hover:text-[color:var(--gold)]">
                  ← Voltar ao catálogo
                </button>
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => shareProduct(selectedProduct)}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[color:var(--line)] px-2.5 text-xs font-medium text-[color:var(--ink)] sm:gap-2 sm:px-3"
                  >
                    <Share2 className="h-4 w-4" />
                    Partilhar
                  </button>
                  <button
                    ref={modalCloseRef}
                    type="button"
                    onClick={closeProduct}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] text-[color:var(--ink)]"
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-10">
              <div className="relative h-[21rem] overflow-hidden bg-[color:#faf7f2] sm:h-[30rem] lg:sticky lg:top-0 lg:h-[38rem]">
                <ProductImage key={selectedProduct.id} src={selectedProduct.imageUrl} alt={selectedProduct.name} priority sizes="(max-width: 640px) 90vw, 480px" />
              </div>
              <div className="min-w-0 space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--atlantic)]">
                  {selectedProduct.brand.name}
                </p>
                <h3 id="catalog-product-title" className="break-words font-serif text-2xl leading-tight text-[color:var(--ink)] sm:text-3xl lg:text-4xl">
                  {selectedProduct.name}
                </h3>
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
              <div className="rounded-[0.9rem] border border-[rgba(185,154,118,0.14)] bg-[color:#faf7f2] px-4 py-3">
                <p className="text-sm font-semibold text-[color:var(--ink)]">
                  <span className="inline-flex items-center gap-2">
                    {selectedConcentration.label === "Gift Set" ? <Gift className="h-4 w-4" aria-hidden="true" /> : <span aria-hidden="true">{selectedConcentration.icon}</span>}
                    {selectedConcentration.label}
                  </span>
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
                  {getProductBottleSizeLabel(selectedProduct)}
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
                    10 ml · {formatPrice(getDisplayPrice(selectedProduct, "10ml"))}
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
                    5 ml · {formatPrice(getDisplayPrice(selectedProduct, "5ml"))}
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
                onClick={() => handleAddToCart(selectedProduct, selectedProductSize)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white"
              >
                Adicionar ao carrinho
              </button> : <a
                href={getReservationUrl(selectedProduct, selectedProductSize)}
                onClick={() => trackInternalEvent({ event: "product_reservation", productId: selectedProduct.id })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white"
              ><MessageCircle className="h-4 w-4" />Reservar</a>}
              <div className="min-w-0 space-y-2 break-words text-xs leading-5 text-slate-600">
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--gold)]" aria-hidden="true" /><span>Entregas em mão na Ilha Terceira</span></p>
                <p className="flex items-start gap-2"><PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--gold)]" aria-hidden="true" /><span>Envios via CTT para Açores, Madeira e Portugal Continental</span></p>
              </div>
              <div className="min-w-0 whitespace-pre-line break-words text-sm leading-7 text-slate-600 [overflow-wrap:anywhere]">
                {selectedProduct.description}
              </div>
              </div>
              </div>
              {relatedProducts.length > 0 ? (
                <section className="border-t border-[color:var(--line)] pt-4">
                  <h4 className="font-serif text-xl text-[color:var(--ink)]">Também pode gostar</h4>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                    {relatedProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/catalogo?produto=${encodeURIComponent(product.slug)}`}
                        scroll={false}
                        onClick={() => prepareProductOpen(product)}
                        className="group min-w-0 border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]"
                        aria-label={`Ver ${product.name}`}
                      >
                        <div className="relative aspect-square overflow-hidden bg-[color:#f6f4f0]">
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            sizes="(max-width: 640px) 30vw, 140px"
                          />
                        </div>
                        <p className="mt-2 line-clamp-2 min-h-8 text-xs font-semibold leading-4 text-[color:var(--ink)]">
                          {product.name}
                        </p>
                        <p className="mt-1 truncate text-[0.65rem] uppercase tracking-[0.08em] text-[color:var(--atlantic)]">
                          {product.brand.name}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[color:var(--ink)]">
                          {formatPrice(getDisplayPrice(product, "100ml"))}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      <section className="min-w-0 bg-transparent pb-2 pt-0 sm:px-4 sm:py-4 lg:sticky lg:top-32 lg:overflow-hidden lg:border-r lg:border-[color:var(--line)] lg:bg-transparent lg:px-0 lg:pr-6">
        <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                const normalized = normalizeCatalogSearchText(search).trim();
                if (normalized.length < 2 || normalized.length > 80) return;
                const interactionKey = `${normalized}|${activeFilter}|${selectedBrand}|${filteredProducts.length}`;
                if (lastTrackedSearch.current === interactionKey) return;
                trackInternalSearch(search, filteredProducts.length);
                lastTrackedSearch.current = interactionKey;
              }}
              placeholder="Pesquisar perfumes..."
              className="h-12 w-full rounded-full border border-[color:var(--line)] bg-white px-11 text-base shadow-[0_3px_12px_rgba(45,35,28,0.035)] outline-none transition focus:border-[color:var(--gold)] md:text-sm"
            />
        </div>

        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={mobileFiltersOpen}
          className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[color:var(--line)] bg-white text-sm font-medium text-[color:var(--ink)] transition hover:border-[color:var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)] lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4 text-[color:var(--gold)]" aria-hidden="true" />
          {activeFilterCount ? `Filtros (${activeFilterCount})` : "Filtros"}
        </button>

        <p className="mt-6 hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink)] lg:block">Categorias</p>
        <div className="mt-3 hidden w-full min-w-0 max-w-full lg:flex lg:flex-col lg:items-stretch lg:gap-0.5 lg:overflow-visible" role="group" aria-label="Filtrar por categoria">
          {catalogFilters.map((filter) => <button key={filter} type="button" onClick={() => { setSelectedFilter(filter); setVisibleCount(INITIAL_VISIBLE_PRODUCTS); }} aria-pressed={activeFilter === filter} className={`min-h-9 shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm lg:w-full lg:rounded-none lg:border-y-0 lg:border-r-0 lg:bg-transparent lg:py-2 lg:pr-0 lg:text-left ${activeFilter === filter ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white lg:border-l-2 lg:pl-3 lg:text-[color:var(--gold)]" : "border-[color:var(--line)] bg-white text-slate-700 hover:border-[color:var(--gold)] lg:border-l-2 lg:border-l-transparent lg:pl-3 lg:hover:bg-transparent lg:hover:text-[color:var(--gold)]"}`}>{filter}</button>)}
        </div>
        <div className="mt-4 hidden lg:block lg:border-t lg:border-[color:var(--line)] lg:pt-5">
          <div className="min-w-0">
          <label htmlFor="catalog-brand" className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500 lg:text-[10px] lg:text-[color:var(--ink)]">Marca</label>
          <select id="catalog-brand" value={selectedBrand} onChange={(event) => { setSelectedBrand(event.target.value); setVisibleCount(INITIAL_VISIBLE_PRODUCTS); }} className="h-11 min-w-0 w-full rounded-full border border-[color:var(--line)] bg-white px-3 text-xs outline-none focus:border-[color:var(--gold)] sm:text-sm lg:mt-3 lg:w-full lg:max-w-none lg:rounded-none lg:border-x-0 lg:border-t-0 lg:bg-transparent lg:px-0">
            <option value="">Todas as marcas</option>
            {availableBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
          </div>
          <div className="min-w-0 lg:hidden">
          <label htmlFor="catalog-sort-mobile" className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">Ordenar por</label>
          <select id="catalog-sort-mobile" value={sortBy} onChange={(event) => { setSortBy(event.target.value as SortOption); setVisibleCount(INITIAL_VISIBLE_PRODUCTS); }} className="h-11 min-w-0 w-full rounded-full border border-[color:var(--line)] bg-white px-3 text-xs outline-none focus:border-[color:var(--gold)] sm:text-sm">
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          </div>
        </div>

        <div className="mt-4 hidden flex-col gap-2 border-t border-[color:var(--line)] pt-5 lg:block">
          <span className="shrink-0 text-sm font-medium text-slate-600 lg:block lg:text-[10px] lg:font-semibold lg:uppercase lg:tracking-[0.12em] lg:text-[color:var(--ink)]">Ordenar por</span>
          <div className="flex w-full min-w-0 max-w-full flex-1 gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mt-2 lg:flex-col lg:gap-0 lg:overflow-visible" role="group" aria-label="Ordenar produtos">
            {sortOptions.map((option) => <button key={option.value} type="button" onClick={() => { setSortBy(option.value); setVisibleCount(INITIAL_VISIBLE_PRODUCTS); }} aria-pressed={sortBy === option.value} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition sm:text-sm lg:w-full lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-1.5 lg:text-left ${sortBy === option.value ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white lg:text-[color:var(--gold)]" : "border-[color:var(--line)] bg-white text-slate-700 hover:border-[color:var(--gold)] lg:hover:text-[color:var(--gold)]"}`}>{option.label}</button>)}
          </div>
        </div>
        {hasActiveFilters ? <button
          type="button"
          className="mt-2 hidden text-sm text-[color:var(--atlantic)] underline-offset-4 hover:underline lg:inline-block"
          onClick={() => {
            setSelectedBrand("");
            setSelectedFilter("Todos");
            setSearch("");
            setSortBy("recommended");
            setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
          }}
        >
          Limpar filtros
        </button> : null}
      </section>

      {mobileFiltersOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end bg-black/35 backdrop-blur-[2px] lg:hidden"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMobileFiltersOpen(false);
          }}
        >
          <div
            ref={mobileFiltersRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filters-title"
            className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border-t border-[color:var(--line)] bg-[color:#fbfaf7] shadow-[0_-20px_60px_rgba(35,26,20,0.16)]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--line)] px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
              <h2 id="mobile-filters-title" className="font-serif text-2xl text-[color:var(--ink)]">Filtros</h2>
              <button
                ref={mobileFiltersCloseRef}
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Fechar filtros"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 py-5">
              <fieldset>
                <legend className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)]">Categoria</legend>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1" role="group" aria-label="Filtrar por categoria">
                  {catalogFilters.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => { setSelectedFilter(filter); setVisibleCount(INITIAL_VISIBLE_PRODUCTS); }}
                      aria-pressed={activeFilter === filter}
                      className={`flex min-h-11 items-center gap-3 border-b border-[color:var(--line)] px-1 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)] ${activeFilter === filter ? "font-semibold text-[color:var(--gold)]" : "text-[color:var(--ink)]"}`}
                    >
                      <span className={`h-3.5 w-3.5 rounded-full border ${activeFilter === filter ? "border-[color:var(--gold)] bg-[color:var(--gold)] shadow-[inset_0_0_0_3px_#fbfaf7]" : "border-slate-400"}`} aria-hidden="true" />
                      {filter}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="catalog-brand-mobile" className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)]">Marca</label>
                <select id="catalog-brand-mobile" value={selectedBrand} onChange={(event) => { setSelectedBrand(event.target.value); setVisibleCount(INITIAL_VISIBLE_PRODUCTS); }} className="h-12 w-full rounded-xl border border-[color:var(--line)] bg-white px-4 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--gold)]">
                  <option value="">Todas as marcas</option>
                  {availableBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="catalog-sort-sheet" className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)]">Ordenar por</label>
                <select id="catalog-sort-sheet" value={sortBy} onChange={(event) => { setSortBy(event.target.value as SortOption); setVisibleCount(INITIAL_VISIBLE_PRODUCTS); }} className="h-12 w-full rounded-xl border border-[color:var(--line)] bg-white px-4 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--gold)]">
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>

            <div className="shrink-0 border-t border-[color:var(--line)] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand("");
                  setSelectedFilter("Todos");
                  setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
                }}
                className="mb-3 min-h-11 w-full text-sm text-[color:var(--atlantic)] underline underline-offset-4 disabled:cursor-default disabled:opacity-40"
                disabled={activeFilterCount === 0}
              >
                Limpar filtros
              </button>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="min-h-12 w-full rounded-full bg-[color:var(--ink)] px-5 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[color:var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)] focus-visible:ring-offset-2">
                Ver produtos
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-w-0 space-y-8 pt-2 sm:pt-5 lg:pt-0">

      {filteredProducts.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-[color:var(--line)] bg-white/70 px-6 py-16 text-center text-slate-500">
          Nenhum produto encontrado com os filtros atuais.
        </section>
      ) : null}

      <section className="grid min-w-0 grid-cols-2 gap-x-2.5 gap-y-6 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {visibleProducts.map((product, index) => {
          const selectedSize = getSelectedSize(product);
          const hasDiscount =
            product.salePriceInCents !== null &&
            product.salePriceInCents < product.priceInCents;
          const currentPrice = getDisplayPrice(product, selectedSize);
          const shouldPreloadImage = index < 4;
          const productBadge = product.bestseller ? "Mais vendido" : null;

          return (
            <article
              key={product.id}
              className="group relative flex min-w-0 h-full flex-col overflow-hidden bg-transparent transition duration-300 hover:-translate-y-0.5"
            >
              {productBadge ? (
                <div className="pointer-events-none absolute left-2 top-2 z-20 rounded-full bg-[color:#8f6844] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-white shadow-sm sm:left-3 sm:top-3 sm:text-[9px]">
                  {productBadge}
                </div>
              ) : null}
              <Link
                href={`/catalogo?produto=${encodeURIComponent(product.slug)}`}
                scroll={false}
                onClick={() => prepareProductOpen(product)}
                className="relative aspect-square bg-[color:#f6f4f0] text-left sm:aspect-auto sm:h-[270px] lg:h-[310px]"
              >
                <div className="relative h-full w-full overflow-hidden">
                  <ProductImage
                    key={product.imageUrl || product.id}
                    src={product.imageUrl}
                    alt={product.name}
                    priority={shouldPreloadImage}
                  />
                </div>
              </Link>

              <div className="relative flex flex-1 flex-col pt-1.5 sm:pt-2">
                <div>
                  <p className="truncate text-[9px] font-medium uppercase tracking-[0.1em] text-[color:#7a624d] sm:text-[10px]">
                    {product.brand.name}
                  </p>

                  <h3 className="mt-0.5 line-clamp-2 min-h-[2.35rem] font-serif text-[0.98rem] leading-[1.18] text-[color:var(--ink)] sm:min-h-[2.8rem] sm:text-[1.16rem]">
                    <Link href={`/catalogo?produto=${encodeURIComponent(product.slug)}`} scroll={false} onClick={() => prepareProductOpen(product)} className="transition hover:text-[color:var(--gold)]">{product.name}</Link>
                  </h3>
                  <p className="mt-0.5 truncate text-[9px] uppercase tracking-[0.06em] text-slate-500 sm:text-[10px]">
                    {getProductAudienceLabel(product.audience)} · {getSelectedSizeLabel(product, selectedSize)}
                  </p>
                </div>

                <div className="mt-1.5 space-y-1.5">
                  <div className="flex flex-nowrap gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {activeFilter !== "Decants" ? <button
                      type="button"
                      onClick={() => setProductSize(product.id, "100ml")}
                      className={`min-h-9 shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.03em] transition sm:min-h-0 sm:px-2 sm:text-[9px] ${
                        selectedSize === "100ml"
                          ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                          : "border-[color:var(--line)] bg-white text-slate-600 hover:border-[rgba(185,154,118,0.4)]"
                      }`}
                    >
                      {getProductBottleSizeLabel(product)}
                    </button> : null}
                    {product.availableInTenMl ? (
                      <button
                        type="button"
                        onClick={() => setProductSize(product.id, "10ml")}
                        className={`min-h-9 shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.03em] transition sm:min-h-0 sm:px-2 sm:text-[9px] ${
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
                        className={`min-h-9 shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.03em] transition sm:min-h-0 sm:px-2 sm:text-[9px] ${
                          selectedSize === "5ml"
                            ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-white"
                            : "border-[color:var(--line)] bg-white text-slate-600 hover:border-[rgba(185,154,118,0.4)]"
                        }`}
                      >
                        5 ml
                      </button>
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="font-serif text-[1.18rem] leading-none text-[color:var(--ink)] sm:text-[1.3rem]">
                        {formatPrice(currentPrice)}
                      </p>
                      {selectedSize === "100ml" && hasDiscount ? (
                        <p className="mt-1 text-[10px] text-slate-400 line-through sm:text-xs">
                          {formatPrice(product.priceInCents)}
                        </p>
                      ) : null}
                    </div>
                    {product.stock > 0 ? <button
                    className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 border border-[color:var(--gold)] bg-transparent px-2 text-[10px] font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--gold)] hover:text-white sm:min-h-[42px] sm:text-xs"
                    onClick={() => handleAddToCart(product, selectedSize)}
                    aria-label="Adicionar ao carrinho"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span className="xl:hidden">Adicionar</span>
                    <span className="hidden xl:inline">Adicionar ao carrinho</span>
                  </button> : <a
                    href={getReservationUrl(product, selectedSize)}
                    onClick={() => trackInternalEvent({ event: "product_reservation", productId: product.id })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 border border-[color:var(--gold)] bg-transparent px-2 text-[10px] font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--gold)] hover:text-white sm:min-h-[42px] sm:text-xs"
                  ><MessageCircle className="h-4 w-4" />Reservar</a>}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
      {visibleCount < filteredProducts.length ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + INITIAL_VISIBLE_PRODUCTS)}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-6 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)]"
          >
            Ver mais
          </button>
        </div>
      ) : null}
      </div>
      </div>
    </div>
  );
}
