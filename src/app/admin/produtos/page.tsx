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
}: {
  active: boolean;
  featured: boolean;
  bestseller: boolean;
  hasDiscount: boolean;
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

export default async function AdminProductsPage() {
  await requireAdmin();

  const [brands, categories, products] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      include: { brand: true, category: true },
      orderBy: [{ bestseller: "desc" }, { featured: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

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
            <select name="audience" className="h-12 rounded-2xl border px-4" defaultValue="UNISSEXO" required>
              {productAudienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              name="priceInCents"
              type="number"
              placeholder="Preço base em cêntimos"
              className="h-12 rounded-2xl border px-4"
              required
            />
            <input
              name="salePriceInCents"
              type="number"
              placeholder="Preço com desconto em cêntimos"
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
                A imagem só aparece na loja quando fazes upload aqui.
              </div>
            </div>
            <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white md:col-span-2">
              Guardar produto
            </button>
          </form>
        </section>

        <section className="space-y-4">
          {products.map((product) => {
            const hasDiscount =
              product.salePriceInCents !== null &&
              product.salePriceInCents < product.priceInCents;

            return (
              <article
                key={product.id}
                className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-serif text-3xl text-[color:var(--ink)]">{product.name}</h3>
                    <p className="text-sm text-slate-500">
                      {product.brand.name} . {product.category.name} . {getProductAudienceLabel(product.audience)}
                    </p>
                  </div>
                  <ProductFlags
                    active={product.active}
                    featured={product.featured}
                    bestseller={product.bestseller}
                    hasDiscount={hasDiscount}
                  />
                </div>

                <form
                  action={saveProduct}
                  className="grid gap-4 md:grid-cols-2"
                  encType="multipart/form-data"
                >
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="currentImageUrl" value={product.imageUrl} />

                  <div className="relative h-40 overflow-hidden rounded-[1.25rem] bg-[color:var(--sand-soft)] md:col-span-2">
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
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
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
                    name="priceInCents"
                    type="number"
                    defaultValue={product.priceInCents}
                    className="h-12 rounded-2xl border px-4"
                    required
                  />
                  <input
                    name="salePriceInCents"
                    type="number"
                    defaultValue={product.salePriceInCents ?? ""}
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
                    <input name="imageFile" type="file" accept="image/*" className="w-full" />
                  </label>
                  <textarea
                    name="description"
                    defaultValue={product.description}
                    className="min-h-32 rounded-2xl border px-4 py-3 md:col-span-2"
                    required
                  />
                  <div className="grid gap-3 md:col-span-2 md:grid-cols-4">
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
                      {product.imageUrl
                        ? "Imagem guardada."
                        : "Sem imagem. O logótipo da loja aparece como base até fazeres upload."}
                    </div>
                  </div>
                  <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white">
                    Atualizar
                  </button>
                </form>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Preço base {formatPrice(product.priceInCents)}
                    {hasDiscount ? ` . desconto ${formatPrice(product.salePriceInCents ?? 0)}` : ""}
                  </p>
                  <form action={deleteProduct}>
                    <input type="hidden" name="id" value={product.id} />
                    <button className="text-sm text-red-500">Eliminar produto</button>
                  </form>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </AdminShell>
  );
}
