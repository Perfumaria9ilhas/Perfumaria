"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { MapPin, MessageCircle, Minus, Plus, PackageCheck, Search, Share2, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";
import {
  normalizeCatalogSearchText,
  productMatchesCatalogSearch,
} from "@/lib/catalog-search";
import { buildMetaProductPayload, trackMetaEvent } from "@/lib/meta-pixel";
import { trackInternalEvent, trackInternalSearch } from "@/lib/internal-analytics";
import { getProductConcentrationDetails } from "@/lib/product-concentration";
import {
  buildCartLineId,
  getDecantPriceInCents,
  getProductBottleSizeLabel,
  getProductSizeLabel,
  type ProductSizeValue,
} from "@/lib/product-sizes";
import type { CatalogProduct } from "@/lib/types";

import { PublicDialog } from "@/components/store/public-dialog";
import { ProductCard } from "@/components/store/product-card";
import { FavoriteButton } from "@/components/providers/favorites-provider";
import { getStoreCollections } from "@/lib/store-collections";
import { TrackedWhatsAppLink } from "@/components/analytics/tracked-whatsapp-link";

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
  if (size === "5ml" || size === "10ml") return getDecantPriceInCents(product.decantBottlePriceInCents ?? getBottlePrice(product), size);
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
      role="status"
      className={`pointer-events-none fixed bottom-24 right-4 z-[95] max-w-[calc(100vw-32px)] rounded-2xl px-5 py-4 text-sm shadow-xl md:bottom-6 md:right-6 ${
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
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [draft, setDraft] = useState<{brand: string; collection: string; audience: string; sort: SortOption}>({brand: "", collection: "", audience: "", sort: "recommended"});
  const collections = useMemo(() => getStoreCollections(products), [products]);
  const collectionKey = selectedCollection ?? (searchParams.get("formato") === "decants" ? "decants" : searchParams.get("categoria") ? `category:${searchParams.get("categoria")}` : searchParams.get("tipo") ? `type:${searchParams.get("tipo")}` : "");
  const audienceFromQuery = searchParams.get("audience")?.toUpperCase() ?? "";
  const audience = selectedAudience ?? (["MASCULINO", "FEMININO", "UNISSEXO"].includes(audienceFromQuery) ? audienceFromQuery : "");
  const [toast, setToast] = useState<{
    message: string;
    tone: "warning" | "success";
  } | null>(null);

  const activeFilter = selectedFilter ?? (collectionKey === "decants" ? "Decants" : "Todos");
  const activeFilterCount = (collectionKey ? 1 : 0) + (selectedBrand ? 1 : 0) + (audience ? 1 : 0);
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

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesBrand = !selectedBrand || product.brand.id === selectedBrand;
      const matchesCategory = matchesCatalogFilter(product, activeFilter);
      const matchesSearch = productMatchesCatalogSearch(product, search);

      const collection = collections.find((entry) => entry.key === collectionKey);
      const matchesCollection = !collection || collection.kind === "decants" || (collection.kind === "type" ? product.productType.slug === collection.slug : product.category.slug === collection.slug);
      return matchesBrand && matchesCategory && matchesSearch && matchesCollection && (!audience || product.audience === audience);
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
  }, [activeFilter, products, search, selectedBrand, selectedSizes, sortBy, collections, collectionKey, audience]);
  const hasActiveFilters =
    Boolean(collectionKey) || Boolean(audience) || activeFilter !== "Todos" || Boolean(selectedBrand) || Boolean(search.trim()) || sortBy !== "recommended";

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

  async function handleAddToCart(product: CatalogProduct, size = getSelectedSize(product), count = 1) {
    if (product.stock <= 0) return;
    addItem(
      buildCartItem(product, size),
      count,
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
    setQuantity(1);
    setSelectedSizes((current) => ({ ...current, [product.id]: "100ml" }));
  }
  function closeProduct() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("produto");
    router.replace(`/catalogo${params.size ? `?${params}` : ""}`, { scroll: false });
  }
  function changeCollection(value: string) {
    setSelectedCollection(value);
    setSelectedFilter(null);
    setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
  }
  function clearFilters() {
    changeCollection(""); setSelectedAudience(""); setSelectedBrand(""); setSearch(""); setSortBy("recommended");
  }
  function openFilters() {
    setDraft({brand: selectedBrand, collection: collectionKey, audience, sort: sortBy});
    setMobileFiltersOpen(true);
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
    <div className="min-w-0">
      {!selectedProduct && toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
      <PublicDialog open={Boolean(selectedProduct)} onClose={closeProduct} title={selectedProduct?.name ?? "Produto"} hideTitle className="store-product-dialog">
        {selectedProduct ? <>
          <div className="store-product-topbar">
            <button onClick={closeProduct}>← Voltar ao catálogo</button>
            <div><FavoriteButton product={selectedProduct} /><button className="store-icon" onClick={() => shareProduct(selectedProduct)} aria-label="Partilhar produto"><Share2 size={18} /></button><button className="store-icon" onClick={closeProduct} aria-label="Fechar produto"><X size={21} /></button></div>
          </div>
          <div className="store-product-layout">
            <div className="store-product-photo"><ProductImage key={selectedProduct.id} src={selectedProduct.imageUrl} alt={selectedProduct.name} priority sizes="(max-width: 767px) 90vw, 520px" /></div>
            <div className="store-product-info">
              <div className="store-product-name-row"><div><h2>{selectedProduct.name}</h2><p className="store-product-brand">{selectedProduct.brand.name}</p></div>{selectedProduct.perfumeOfDay || selectedProduct.bestseller || selectedProduct.featured ? <span className="store-badge">{selectedProduct.perfumeOfDay ? "-10% hoje" : selectedProduct.bestseller ? "Mais vendido" : "Em destaque"}</span> : null}</div>
              <div className="store-product-price"><strong>{formatPrice(getDisplayPrice(selectedProduct, selectedProductSize))}</strong>{selectedProductSize === "100ml" && getBottlePrice(selectedProduct) < selectedProduct.priceInCents ? <del>{formatPrice(selectedProduct.priceInCents)}</del> : null}</div>
              <div><p className="store-field">Tamanho</p><div className="store-variant-options"><button aria-pressed={selectedProductSize === "100ml"} onClick={() => setProductSize(selectedProduct.id, "100ml")}>{getProductBottleSizeLabel(selectedProduct)}</button></div></div>
              {selectedProduct.availableInFiveMl || selectedProduct.availableInTenMl ? <div><p className="store-field">Decants</p><div className="store-variant-options">
                <button aria-pressed={selectedProductSize === "100ml"} onClick={() => setProductSize(selectedProduct.id, "100ml")}>Sem decant</button>
                {selectedProduct.availableInFiveMl ? <button aria-pressed={selectedProductSize === "5ml"} onClick={() => setProductSize(selectedProduct.id, "5ml")}>5 ml<small>{formatPrice(getDisplayPrice(selectedProduct, "5ml"))}</small></button> : null}
                {selectedProduct.availableInTenMl ? <button aria-pressed={selectedProductSize === "10ml"} onClick={() => setProductSize(selectedProduct.id, "10ml")}>10 ml<small>{formatPrice(getDisplayPrice(selectedProduct, "10ml"))}</small></button> : null}
              </div></div> : null}
              <div className="store-availability">{selectedProduct.stock > 0 ? <strong>Em stock</strong> : <><strong>Produto disponível por reserva.</strong>Fale connosco por WhatsApp para confirmar.</>}</div>
              <div className="store-product-buy">
                {selectedProduct.stock > 0 ? <><div className="store-quantity"><button aria-label="Diminuir quantidade do produto" disabled={quantity === 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={16} /></button><output aria-label="Quantidade">{quantity}</output><button aria-label="Aumentar quantidade do produto" disabled={quantity === 99} onClick={() => setQuantity((value) => Math.min(99, value + 1))}><Plus size={16} /></button></div><button className="store-button" onClick={() => handleAddToCart(selectedProduct, selectedProductSize, quantity)}><ShoppingBag size={17} />Adicionar ao carrinho</button></> : <a className="store-button" href={getReservationUrl(selectedProduct, selectedProductSize)} target="_blank" rel="noopener noreferrer" onClick={() => trackInternalEvent({ event: "product_reservation", productId: selectedProduct.id })}><MessageCircle size={17} />Reservar no WhatsApp</a>}
              </div>
              {toast ? <p role="status" className="store-product-feedback">{toast.message}</p> : null}
              <div className="store-product-benefits"><span><MapPin size={16} />Ilha Terceira</span><span><PackageCheck size={16} />Envios CTT</span><span>MBWay ou transferência</span></div>
            </div>
          </div>
          <div className="store-product-details">
            <details open><summary>Descrição</summary><p>{selectedProduct.description}</p></details>
            {selectedProduct.inspiredBy ? <details><summary>Inspiração</summary><p>{selectedProduct.inspiredBy}</p></details> : null}
            <details><summary>Concentração e duração</summary><p>{selectedConcentration.label}{selectedConcentration.description ? " · " + selectedConcentration.description : ""}{selectedProduct.durationLabel ? "\n" + selectedProduct.durationLabel : ""}</p></details>
            <details><summary>Disponibilidade e entrega</summary><p>{selectedProduct.stock > 0 ? "Em stock." : "Disponível por reserva. Contacte-nos para confirmar."} Entregas em mão na Ilha Terceira e envios via CTT para Açores, Madeira e Portugal Continental.</p></details>
          </div>
          {relatedProducts.length ? <section className="store-related"><h3>Também pode gostar</h3><div className="store-related-grid">{relatedProducts.map((product) => <ProductCard key={product.id} product={product} onOpen={() => prepareProductOpen(product)} />)}</div></section> : null}
        </> : null}
      </PublicDialog>

      <section className="store-catalog-toolbar" aria-label="Pesquisa e filtros">
        <div className="store-search-row"><div className="store-search-field"><Search size={18} /><input aria-label="Pesquisar produtos" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(INITIAL_VISIBLE_PRODUCTS); }} placeholder="Pesquise perfume, marca ou inspiração…" type="search" /></div><button className="store-filter-button" onClick={openFilters} aria-haspopup="dialog" aria-expanded={mobileFiltersOpen}><SlidersHorizontal size={16} />Filtros{activeFilterCount ? ` (${activeFilterCount})` : ""}</button></div>
        <div className="store-audience-chips" role="group" aria-label="Filtrar por público">{[{value: "", label: "Todos"}, {value: "FEMININO", label: "Feminino"}, {value: "MASCULINO", label: "Masculino"}, {value: "UNISSEXO", label: "Unissexo"}].map((option) => <button key={option.value} aria-pressed={audience === option.value} onClick={() => { setSelectedAudience(option.value); setVisibleCount(INITIAL_VISIBLE_PRODUCTS); }}>{option.label}</button>)}</div>
        <div className="store-filter-chips" aria-label="Coleções"><button aria-pressed={!collectionKey} onClick={() => changeCollection("")}>Todos</button>{collections.map((collection) => <button key={collection.key} aria-pressed={collectionKey === collection.key} onClick={() => changeCollection(collection.key)}>{collection.label}</button>)}</div>
        <div className="store-desktop-filters">
          <label className="store-field">Marca<select value={selectedBrand} onChange={(event) => { setSelectedBrand(event.target.value); setVisibleCount(INITIAL_VISIBLE_PRODUCTS); }}><option value="">Todas as marcas</option>{availableBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
          <label className="store-field">Categoria<select value={collectionKey} onChange={(event) => changeCollection(event.target.value)}><option value="">Todas as categorias</option>{collections.map((collection) => <option key={collection.key} value={collection.key}>{collection.label}</option>)}</select></label>
          <label className="store-field">Ordenar por<select value={sortBy} onChange={(event) => { setSortBy(event.target.value as SortOption); setVisibleCount(INITIAL_VISIBLE_PRODUCTS); }}>{sortOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
        </div>
      </section>
      <PublicDialog open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title="Filtros" className="store-filter-sheet">
        <button className="store-icon store-dialog-close" aria-label="Fechar filtros" onClick={() => setMobileFiltersOpen(false)}><X size={20} /></button>
        <div className="store-filter-fields">
          <label className="store-field">Marca<select value={draft.brand} onChange={(event) => setDraft({ ...draft, brand: event.target.value })}><option value="">Todas as marcas</option>{availableBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
          <label className="store-field">Categoria<select value={draft.collection} onChange={(event) => setDraft({ ...draft, collection: event.target.value })}><option value="">Todas as categorias</option>{collections.map((collection) => <option value={collection.key} key={collection.key}>{collection.label}</option>)}</select></label>
          <label className="store-field">Público<select value={draft.audience} onChange={(event) => setDraft({ ...draft, audience: event.target.value })}><option value="">Todos os públicos</option><option value="MASCULINO">Masculino</option><option value="FEMININO">Feminino</option><option value="UNISSEXO">Unissexo</option></select></label>
          <label className="store-field">Ordenar por<select value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: event.target.value as SortOption })}>{sortOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
        </div>
        <div className="store-filter-footer"><button className="store-button" onClick={() => { setSelectedBrand(draft.brand); changeCollection(draft.collection); setSelectedAudience(draft.audience); setSortBy(draft.sort); setMobileFiltersOpen(false); }}>Aplicar filtros</button><button className="store-button store-button-secondary" onClick={() => { clearFilters(); setDraft({ brand: "", collection: "", audience: "", sort: "recommended" }); }}>Limpar filtros</button></div>
      </PublicDialog>
      <div className="store-catalog-count"><span>{filteredProducts.length} produtos</span>{hasActiveFilters ? <button onClick={clearFilters}>Limpar filtros</button> : null}</div>
      {!filteredProducts.length ? <p className="store-empty">Nenhum produto encontrado com os filtros atuais.</p> : null}
      <section className="store-product-grid" aria-label="Produtos">
        {visibleProducts.map((product, index) => {
          const selectedSize = getSelectedSize(product);
          return <ProductCard key={product.id} product={product} price={getDisplayPrice(product, selectedSize)} originalPrice={selectedSize === "100ml" ? product.priceInCents : getDisplayPrice(product, selectedSize)} priority={index < 4} onOpen={() => prepareProductOpen(product)}>
            {activeFilter !== "Decants" && selectedSize !== "100ml" ? <small className="store-card-variant">Decant {getSelectedSizeLabel(product, selectedSize)}</small> : null}
            {activeFilter === "Decants" ? <div className="store-card-options">{product.availableInFiveMl ? <button aria-pressed={selectedSize === "5ml"} onClick={() => setProductSize(product.id, "5ml")}>5 ml</button> : null}{product.availableInTenMl ? <button aria-pressed={selectedSize === "10ml"} onClick={() => setProductSize(product.id, "10ml")}>10 ml</button> : null}</div> : null}
            {product.stock > 0 ? <button className="store-card-action" onClick={() => handleAddToCart(product, selectedSize)} aria-label={`Adicionar ${product.name} ao carrinho`}><ShoppingBag size={14} />Adicionar</button> : <a className="store-card-action" href={getReservationUrl(product, selectedSize)} target="_blank" rel="noopener noreferrer" onClick={() => trackInternalEvent({ event: "product_reservation", productId: product.id })}>Reservar no WhatsApp</a>}
          </ProductCard>;
        })}
      </section>
      {visibleCount < filteredProducts.length ? <div className="mt-7 flex justify-center"><button className="store-button store-button-secondary" onClick={() => setVisibleCount((current) => current + INITIAL_VISIBLE_PRODUCTS)}>Ver mais</button></div> : null}
      <aside className="store-recommendation" aria-label="Ajuda a escolher perfume"><div><strong>Não sabe qual escolher?</strong><p>Diga-nos que tipo de perfume procura e ajudamos a encontrar o ideal.</p></div><TrackedWhatsAppLink href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Gostava de ajuda para escolher um perfume.")}`} className="store-button store-button-secondary" contentName="Recomendação de perfume"><MessageCircle size={16} />Pedir recomendação</TrackedWhatsAppLink></aside>
    </div>
  );
}
