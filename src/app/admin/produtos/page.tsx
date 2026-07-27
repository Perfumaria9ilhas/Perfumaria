import Image from "next/image";
import { deleteProduct, saveProduct } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getProductAudienceLabel, productAudienceOptions } from "@/lib/product-audience";
import { getProductConcentrationLabel } from "@/lib/product-concentration";
import { prisma } from "@/lib/prisma";
import { ensureDefaultProductTypes } from "@/lib/product-types";

type AdminProductGroup =
  | "todos"
  | "perfumes"
  | "ambientadores"
  | "pastas-corporais"
  | "desodorizantes"
  | "outros";

const primaryAdminProductGroups: Array<{
  value: Exclude<AdminProductGroup, "outros">;
  label: string;
}> = [
  { value: "todos", label: "Todos" },
  { value: "perfumes", label: "Perfumes" },
  { value: "ambientadores", label: "Ambientadores" },
  { value: "pastas-corporais", label: "Pastas Corporais" },
  { value: "desodorizantes", label: "Desodorizantes" },
];

const otherProductTypeSlugs = new Set(["gift-set", "oleo-perfumado"]);

function isAdminProductGroup(value?: string): value is AdminProductGroup {
  return (
    value === "todos" ||
    value === "perfumes" ||
    value === "ambientadores" ||
    value === "pastas-corporais" ||
    value === "desodorizantes" ||
    value === "outros"
  );
}

function getAdminProductTypeSlug(productType?: { slug?: string | null; name?: string | null } | null) {
  return productType?.slug?.trim().toLowerCase() || productType?.name?.trim().toLowerCase() || "";
}

function getAdminProductGroup(product: {
  productType?: { slug?: string | null; name?: string | null } | null;
}) {
  const typeSlug = getAdminProductTypeSlug(product.productType);

  if (typeSlug === "ambientador") {
    return "ambientadores" as const;
  }

  if (typeSlug === "pasta-corporal") {
    return "pastas-corporais" as const;
  }

  if (typeSlug === "desodorizante") {
    return "desodorizantes" as const;
  }

  if (otherProductTypeSlugs.has(typeSlug)) {
    return "outros" as const;
  }

  return "perfumes" as const;
}

function buildProductsAdminHref({
  brandSlug,
  group,
  query,
}: {
  brandSlug?: string;
  group?: AdminProductGroup;
  query?: string;
}) {
  const searchParams = new URLSearchParams();

  if (brandSlug) {
    searchParams.set("marca", brandSlug);
  }

  if (group && group !== "todos") {
    searchParams.set("tipo", group);
  }

  if (query) {
    searchParams.set("q", query);
  }

  const queryString = searchParams.toString();
  return queryString ? `/admin/produtos?${queryString}` : "/admin/produtos";
}

function ProductFlags({
  active,
  featured,
  bestseller,
  hasDiscount,
  availableInFiveMl,
  availableInTenMl,
}: {
  active: boolean;
  featured: boolean;
  bestseller: boolean;
  hasDiscount: boolean;
  availableInFiveMl: boolean;
  availableInTenMl: boolean;
}) {
  const items = [
    {
      label: active ? "Ativo" : "Inativo",
      className: active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
    },
    {
      label: "Destacado",
      visible: featured,
      className: "bg-amber-50 text-amber-700",
    },
    {
      label: "Bestseller",
      visible: bestseller,
      className: "bg-orange-50 text-orange-700",
    },
    {
      label: "Em desconto",
      visible: hasDiscount,
      className: "bg-rose-50 text-rose-700",
    },
    {
      label: "5 ml",
      visible: availableInFiveMl,
      className: "bg-sky-50 text-sky-700",
    },
    {
      label: "10 ml",
      visible: availableInTenMl,
      className: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items
        .filter((item) => item.visible ?? true)
        .map((item) => (
          <span
            key={item.label}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}
          >
            {item.label}
          </span>
        ))}
    </div>
  );
}

function ProductPreview({ imageUrl, name }: { imageUrl: string; name: string }) {
  if (!imageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/65 p-4">
        <Image
          src="/logo-9-ilhas.svg"
          alt="9 Ilhas Perfumaria"
          width={170}
          height={44}
          className="h-auto w-28 opacity-80"
        />
      </div>
    );
  }

  return <Image src={imageUrl} alt={name} fill unoptimized className="object-cover" />;
}

function centsToEuroInput(value: number | null) {
  if (value === null) {
    return "";
  }

  return (value / 100).toFixed(2).replace(".", ",");
}

function getMlStatusText(availableInFiveMl: boolean, availableInTenMl: boolean, imageUrl: string) {
  if (availableInFiveMl || availableInTenMl) {
    const activeSizes = [
      availableInFiveMl ? "5 ml ativo a 3,50 EUR" : null,
      availableInTenMl ? "10 ml ativo a 6,50 EUR" : null,
    ].filter(Boolean);

    return `${activeSizes.join(" · ")}.`;
  }

  if (imageUrl) {
    return "Imagem guardada.";
  }

  return "Sem imagem. O logotipo da loja aparece como base ate fazeres upload.";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ marca?: string; tipo?: string; q?: string }>;
}) {
  await requireAdmin();
  await ensureDefaultProductTypes();

  const params = (await searchParams) ?? {};
  const selectedBrandSlug = params.marca?.trim() ?? "";
  const selectedGroup = isAdminProductGroup(params.tipo) ? params.tipo : "todos";
  const searchQuery = params.q?.trim() ?? "";
  const normalizedSearchQuery = searchQuery.toLocaleLowerCase("pt-PT");

  const [brands, categories, productTypes, products] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.productType.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      include: { brand: true, category: true, productType: true },
      orderBy: [
        { brand: { name: "asc" } },
        { bestseller: "desc" },
        { featured: "desc" },
        { name: "asc" },
      ],
    }),
  ]);

  const baseFilteredProducts = products.filter((product) => {
    const matchesBrand = !selectedBrandSlug || product.brand.slug === selectedBrandSlug;

    const matchesSearch =
      !normalizedSearchQuery ||
      product.name.toLocaleLowerCase("pt-PT").includes(normalizedSearchQuery) ||
      product.brand.name.toLocaleLowerCase("pt-PT").includes(normalizedSearchQuery) ||
      product.category.name.toLocaleLowerCase("pt-PT").includes(normalizedSearchQuery) ||
      (product.productType?.name ?? "").toLocaleLowerCase("pt-PT").includes(normalizedSearchQuery);

    return matchesBrand && matchesSearch;
  });

  const hasOtherProducts =
    products.some((product) => getAdminProductGroup(product) === "outros") ||
    selectedGroup === "outros";

  const filteredProducts =
    selectedGroup === "todos"
      ? baseFilteredProducts
      : baseFilteredProducts.filter((product) => getAdminProductGroup(product) === selectedGroup);

  const productsByBrand = brands
    .map((brand) => ({
      brand,
      products: filteredProducts.filter((product) => product.brandId === brand.id),
    }))
    .filter((entry) => entry.products.length > 0);

  return (
    <AdminShell
      title="Produtos"
      description="Gerir catalogo, fotografias, prioridade de exibicao, descontos e estado de cada produto."
    >
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">Novo produto</h2>
          <form
            action={saveProduct}
            className="mt-6 grid gap-4 md:grid-cols-2"
            encType="multipart/form-data"
          >
            <input
              name="name"
              placeholder="Nome do produto"
              className="h-12 rounded-2xl border px-4"
              required
            />
            <select name="brandId" className="h-12 rounded-2xl border px-4" required>
              <option value="">Selecionar marca</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <select name="categoryId" className="h-12 rounded-2xl border px-4" required>
              <option value="">Selecionar categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              name="audience"
              className="h-12 rounded-2xl border px-4"
              defaultValue="UNISSEXO"
              required
            >
              {productAudienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select name="productTypeId" className="h-12 rounded-2xl border px-4" required>
              <option value="">Selecionar tipo de produto</option>
              {productTypes.map((productType) => (
                <option key={productType.id} value={productType.id}>
                  {productType.name}
                </option>
              ))}
            </select>
            <input
              name="priceInEuros"
              type="text"
              inputMode="decimal"
              placeholder="Preco base em euros (ex: 43,30)"
              className="h-12 rounded-2xl border px-4"
              required
            />
            <input
              name="salePriceInEuros"
              type="text"
              inputMode="decimal"
              placeholder="Preco com desconto em euros"
              className="h-12 rounded-2xl border px-4"
            />
            <input
              name="stock"
              type="number"
              placeholder="Stock"
              className="h-12 rounded-2xl border px-4"
              required
            />
            <label className="flex min-h-12 items-center rounded-2xl border border-dashed px-4 text-sm text-slate-500 md:col-span-2">
              <input name="imageFile" type="file" accept="image/*" className="w-full" />
            </label>
            <textarea
              name="description"
              placeholder="Descricao do produto"
              className="min-h-32 rounded-2xl border px-4 py-3 md:col-span-2"
              required
            />
            <input
              name="inspiredBy"
              placeholder="Inspirado em (opcional)"
              className="h-12 rounded-2xl border px-4 md:col-span-2"
            />
            <input
              name="durationLabel"
              placeholder="Duracao / relogio (ex: 6-8h)"
              className="h-12 rounded-2xl border px-4 md:col-span-2"
            />
            <div className="grid gap-3 md:col-span-2 md:grid-cols-5">
              <label className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                <input
                  name="availableInFiveMl"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4"
                />
                Disponivel em 5 ml
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
                <input name="availableInTenMl" type="checkbox" className="h-4 w-4" />
                Disponivel em 10 ml
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <input name="active" type="checkbox" defaultChecked className="h-4 w-4" />
                Ativo
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <input name="featured" type="checkbox" className="h-4 w-4" />
                Destacado
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                <input name="bestseller" type="checkbox" className="h-4 w-4" />
                Bestseller
              </label>
              <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-4 py-3 text-sm text-slate-600 md:col-span-2">
                Se ativares 5 ml fica sempre a 3,50 EUR e 10 ml fica sempre a 6,50 EUR.
              </div>
            </div>
            <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white md:col-span-2">
              Guardar produto
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="rounded-[2rem] border border-[color:var(--line)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="font-serif text-2xl text-[color:var(--ink)]">Organizar produtos</h2>
                <p className="text-sm text-slate-500">
                  Alterna entre perfumes, ambientadores, pastas corporais e desodorizantes
                  sem duplicar produtos.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {primaryAdminProductGroups.map((group) => {
                  const isActive = selectedGroup === group.value;
                  return (
                    <a
                      key={group.value}
                      href={buildProductsAdminHref({
                        brandSlug: selectedBrandSlug,
                        group: group.value,
                        query: searchQuery,
                      })}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[color:var(--atlantic)] text-white"
                          : "border border-[color:var(--line)] bg-[color:var(--sand-soft)] text-[color:var(--ink)]"
                      }`}
                    >
                      {group.label}
                    </a>
                  );
                })}

                {hasOtherProducts ? (
                  <a
                    href={buildProductsAdminHref({
                      brandSlug: selectedBrandSlug,
                      group: "outros",
                      query: searchQuery,
                    })}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      selectedGroup === "outros"
                        ? "bg-[color:var(--atlantic)] text-white"
                        : "border border-[color:var(--line)] bg-[color:var(--sand-soft)] text-[color:var(--ink)]"
                    }`}
                  >
                    Outros
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <form className="rounded-[2rem] border border-[color:var(--line)] bg-white p-5 shadow-sm">
            <input type="hidden" name="tipo" value={selectedGroup} />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-serif text-2xl text-[color:var(--ink)]">Filtrar produtos</h2>
                <p className="text-sm text-slate-500">
                  A pesquisa atua apenas dentro da area selecionada acima.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Pesquisar por nome, marca, categoria ou tipo"
                  className="h-12 min-w-72 rounded-2xl border px-4"
                />
                <select
                  name="marca"
                  defaultValue={selectedBrandSlug}
                  className="h-12 min-w-60 rounded-2xl border px-4"
                >
                  <option value="">Todas as marcas</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.slug}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white"
                >
                  Aplicar filtro
                </button>
                {selectedBrandSlug || searchQuery || selectedGroup !== "todos" ? (
                  <a
                    href="/admin/produtos"
                    className="rounded-full border border-[color:var(--line)] px-5 py-3 text-center text-sm font-semibold text-[color:var(--ink)]"
                  >
                    Limpar
                  </a>
                ) : null}
              </div>
            </div>
          </form>

          {productsByBrand.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[color:var(--line)] bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
              Nenhum produto encontrado com os filtros atuais.
            </div>
          ) : null}

          {productsByBrand.map(({ brand, products: brandProducts }) => (
            <details
              key={brand.id}
              className="group rounded-[2rem] border border-[color:var(--line)] bg-white shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                <div>
                  <h2 className="font-serif text-3xl text-[color:var(--ink)]">{brand.name}</h2>
                  <p className="text-sm text-slate-500">
                    {brandProducts.length} produto{brandProducts.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[color:var(--atlantic)] transition group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="grid gap-4 border-t border-[color:var(--line)] px-4 py-4 md:grid-cols-2 md:px-6 md:py-6 lg:grid-cols-3 2xl:grid-cols-4">
                {brandProducts.map((product) => {
                  const hasDiscount =
                    product.salePriceInCents !== null &&
                    product.salePriceInCents < product.priceInCents;

                  return (
                    <details
                      key={product.id}
                      className="group h-fit rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)]"
                    >
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-4">
                        <div className="min-w-0 space-y-1">
                          <h3 className="line-clamp-2 font-serif text-2xl leading-tight text-[color:var(--ink)]">
                            {product.name}
                          </h3>
                          <p className="text-xs text-slate-500">{product.category.name}</p>
                          <p className="text-xs text-slate-500">
                            {getProductAudienceLabel(product.audience)} ·{" "}
                            {product.productType?.name ??
                              getProductConcentrationLabel(product.concentration)}{" "}
                            · {formatPrice(product.priceInCents)}
                          </p>
                        </div>
                        <div className="hidden max-w-28 shrink-0 xl:block">
                          <ProductFlags
                            active={product.active}
                            featured={product.featured}
                            bestseller={product.bestseller}
                            hasDiscount={hasDiscount}
                            availableInFiveMl={product.availableInFiveMl}
                            availableInTenMl={product.availableInTenMl}
                          />
                        </div>
                        <span className="text-sm font-semibold text-[color:var(--atlantic)] transition group-open:rotate-45">
                          +
                        </span>
                      </summary>

                      <div className="space-y-4 border-t border-[color:var(--line)] bg-white px-4 py-4">
                        <div className="xl:hidden">
                          <ProductFlags
                            active={product.active}
                            featured={product.featured}
                            bestseller={product.bestseller}
                            hasDiscount={hasDiscount}
                            availableInFiveMl={product.availableInFiveMl}
                            availableInTenMl={product.availableInTenMl}
                          />
                        </div>

                        <form
                          action={saveProduct}
                          className="grid gap-4 md:grid-cols-2"
                          encType="multipart/form-data"
                        >
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="currentImageUrl" value={product.imageUrl} />

                          <div className="relative h-32 overflow-hidden rounded-[1.25rem] bg-[color:var(--sand-soft)] md:col-span-2">
                            <ProductPreview imageUrl={product.imageUrl} name={product.name} />
                          </div>

                          <input
                            name="name"
                            defaultValue={product.name}
                            className="h-12 rounded-2xl border px-4"
                            required
                          />
                          <select
                            name="brandId"
                            defaultValue={product.brandId}
                            className="h-12 rounded-2xl border px-4"
                            required
                          >
                            {brands.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                          <select
                            name="categoryId"
                            defaultValue={product.categoryId}
                            className="h-12 rounded-2xl border px-4"
                            required
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          <select
                            name="audience"
                            defaultValue={product.audience}
                            className="h-12 rounded-2xl border px-4"
                            required
                          >
                            {productAudienceOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <select
                            name="productTypeId"
                            defaultValue={product.productTypeId}
                            className="h-12 rounded-2xl border px-4"
                            required
                          >
                            {productTypes.map((productType) => (
                              <option key={productType.id} value={productType.id}>
                                {productType.name}
                              </option>
                            ))}
                          </select>
                          <input
                            name="priceInEuros"
                            type="text"
                            inputMode="decimal"
                            defaultValue={centsToEuroInput(product.priceInCents)}
                            className="h-12 rounded-2xl border px-4"
                            required
                          />
                          <input
                            name="salePriceInEuros"
                            type="text"
                            inputMode="decimal"
                            defaultValue={centsToEuroInput(product.salePriceInCents)}
                            placeholder="Preco com desconto"
                            className="h-12 rounded-2xl border px-4"
                          />
                          <input
                            name="stock"
                            type="number"
                            defaultValue={product.stock}
                            className="h-12 rounded-2xl border px-4"
                            required
                          />
                          <label className="flex min-h-12 items-center rounded-2xl border border-dashed px-4 text-sm text-slate-500 md:col-span-2">
                            <input
                              name="imageFile"
                              type="file"
                              accept="image/*"
                              className="w-full"
                            />
                          </label>
                          <textarea
                            name="description"
                            defaultValue={product.description}
                            className="min-h-32 rounded-2xl border px-4 py-3 md:col-span-2"
                            required
                          />
                          <input
                            name="inspiredBy"
                            defaultValue={product.inspiredBy ?? ""}
                            placeholder="Inspirado em"
                            className="h-12 rounded-2xl border px-4 md:col-span-2"
                          />
                          <input
                            name="durationLabel"
                            defaultValue={product.durationLabel ?? ""}
                            placeholder="Duracao / relogio (ex: 6-8h)"
                            className="h-12 rounded-2xl border px-4 md:col-span-2"
                          />
                          <div className="grid gap-3 md:col-span-2 md:grid-cols-5">
                            <label className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                              <input
                                name="availableInFiveMl"
                                type="checkbox"
                                defaultChecked={product.availableInFiveMl}
                                className="h-4 w-4"
                              />
                              Disponivel em 5 ml
                            </label>
                            <label className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
                              <input
                                name="availableInTenMl"
                                type="checkbox"
                                defaultChecked={product.availableInTenMl}
                                className="h-4 w-4"
                              />
                              Disponivel em 10 ml
                            </label>
                            <label className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                              <input
                                name="active"
                                type="checkbox"
                                defaultChecked={product.active}
                                className="h-4 w-4"
                              />
                              Ativo
                            </label>
                            <label className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                              <input
                                name="featured"
                                type="checkbox"
                                defaultChecked={product.featured}
                                className="h-4 w-4"
                              />
                              Destacado
                            </label>
                            <label className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                              <input
                                name="bestseller"
                                type="checkbox"
                                defaultChecked={product.bestseller}
                                className="h-4 w-4"
                              />
                              Bestseller
                            </label>
                            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-4 py-3 text-sm text-slate-600 md:col-span-2">
                              {getMlStatusText(
                                product.availableInFiveMl,
                                product.availableInTenMl,
                                product.imageUrl,
                              )}
                            </div>
                          </div>
                          <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white md:col-span-2">
                            Atualizar
                          </button>
                        </form>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm text-slate-500">
                            Preco base {formatPrice(product.priceInCents)}
                            {hasDiscount
                              ? ` · desconto ${formatPrice(product.salePriceInCents ?? 0)}`
                              : ""}
                          </p>
                          <form action={deleteProduct}>
                            <input type="hidden" name="id" value={product.id} />
                            <button className="text-sm text-red-500">Eliminar produto</button>
                          </form>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </details>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}
