import Image from "next/image";
import { deleteProduct, saveProduct } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getProductAudienceLabel, productAudienceOptions } from "@/lib/product-audience";
import { prisma } from "@/lib/prisma";

function ProductFlags({
  active,
  featured,
  bestseller,
  hasDiscount,
  availableInFiveMl,
}: {
  active: boolean;
  featured: boolean;
  bestseller: boolean;
  hasDiscount: boolean;
  availableInFiveMl: boolean;
}) {
  const items = [
    {
      label: active ? "Ativo" : "Inativo",
      className: active
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-500",
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

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ marca?: string }>;
}) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const selectedBrandSlug = params.marca ?? "";

  const [brands, categories, products] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      include: { brand: true, category: true },
      orderBy: [
        { brand: { name: "asc" } },
        { bestseller: "desc" },
        { featured: "desc" },
        { name: "asc" },
      ],
    }),
  ]);

  const productsByBrand = brands
    .map((brand) => ({
      brand,
      products: products.filter((product) => product.brandId === brand.id),
    }))
    .filter((entry) => (selectedBrandSlug ? entry.brand.slug === selectedBrandSlug : true))
    .filter((entry) => entry.products.length > 0);

  return (
    <AdminShell
      title="Produtos"
      description="Gerir catálogo, fotografias, prioridade de exibição, descontos e estado de cada produto."
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
              placeholder="Nome do perfume"
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
            <input
              name="priceInEuros"
              type="text"
              inputMode="decimal"
              placeholder="Preço base em euros (ex: 43,30)"
              className="h-12 rounded-2xl border px-4"
              required
            />
            <input
              name="salePriceInEuros"
              type="text"
              inputMode="decimal"
              placeholder="Preço com desconto em euros"
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
              placeholder="Descrição do produto"
              className="min-h-32 rounded-2xl border px-4 py-3 md:col-span-2"
              required
            />
            <div className="grid gap-3 md:col-span-2 md:grid-cols-4">
              <label className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                <input
                  name="availableInFiveMl"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4"
                />
                Disponível em 5 ml
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
              <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-4 py-3 text-sm text-slate-600">
                Se ativares 5 ml, o valor na loja fica sempre a 3,50 €.
              </div>
            </div>
            <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white md:col-span-2">
              Guardar produto
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <form className="rounded-[2rem] border border-[color:var(--line)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-serif text-2xl text-[color:var(--ink)]">Filtrar produtos</h2>
                <p className="text-sm text-slate-500">
                  Escolhe uma marca para encontrares mais depressa o que queres editar.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
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
                {selectedBrandSlug ? (
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
                          <p className="text-xs text-slate-500">
                            {product.category.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {getProductAudienceLabel(product.audience)} . {formatPrice(product.priceInCents)}
                          </p>
                        </div>
                        <div className="hidden max-w-28 shrink-0 xl:block">
                          <ProductFlags
                            active={product.active}
                            featured={product.featured}
                            bestseller={product.bestseller}
                            hasDiscount={hasDiscount}
                            availableInFiveMl={product.availableInFiveMl}
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
                            placeholder="Preço com desconto"
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
                          <div className="grid gap-3 md:col-span-2 md:grid-cols-4">
                            <label className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                              <input
                                name="availableInFiveMl"
                                type="checkbox"
                                defaultChecked={product.availableInFiveMl}
                                className="h-4 w-4"
                              />
                              Disponível em 5 ml
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
                            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-4 py-3 text-sm text-slate-600">
                              {product.availableInFiveMl
                                ? "5 ml ativo a 3,50 €."
                                : product.imageUrl
                                  ? "Imagem guardada."
                                  : "Sem imagem. O logótipo da loja aparece como base até fazeres upload."}
                            </div>
                          </div>
                          <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white md:col-span-2">
                            Atualizar
                          </button>
                        </form>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm text-slate-500">
                            Preço base {formatPrice(product.priceInCents)}
                            {hasDiscount
                              ? ` . desconto ${formatPrice(product.salePriceInCents ?? 0)}`
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
