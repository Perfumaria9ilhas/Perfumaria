import Image from "next/image";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { HomeFeaturedProducts } from "@/components/admin/home-featured-products";
import { ProductEditor, ProductDelete } from "@/components/admin/product-editor";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

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


export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ marca?: string; tipo?: string; q?: string; preferidos?: string; novo?: string; editar?: string; pagina?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const group = isAdminProductGroup(params.tipo) ? params.tipo : "todos";
  const query = params.q?.trim() ?? "";
  const brandSlug = params.marca?.trim() ?? "";
  const [brands, categories, types, products] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }), prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.productType.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ include: { brand: true, category: true, productType: true }, orderBy: [{ brand: { name: "asc" } }, { name: "asc" }] }),
  ]);
  const filtered = products.filter((p) => (!brandSlug || p.brand.slug === brandSlug) && (group === "todos" || getAdminProductGroup(p) === group) && (!query || `${p.name} ${p.brand.name} ${p.category.name} ${p.productType.name}`.toLocaleLowerCase("pt").includes(query.toLocaleLowerCase("pt"))));
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const page = Math.max(1, Math.min(pages, Number(params.pagina) || 1));
  const visible = filtered.slice((page - 1) * 20, page * 20);
  const editing = products.find((p) => p.id === params.editar);
  const href = buildProductsAdminHref({ brandSlug, group, query });
  const pageHref = (n: number) => `${href}${href.includes("?") ? "&" : "?"}pagina=${n}`;
  return <AdminShell title="Produtos" description="Gerir catálogo, fotografias, preços e disponibilidade.">
    <div className="space-y-4">
      <div className="flex justify-end"><Link href="/admin/produtos?novo=1#novo-produto" className="rounded-xl bg-[color:var(--atlantic)] px-4 py-3 text-sm text-white">+ Novo produto</Link></div>
      {params.novo === "1" || editing ? <section id={editing ? "editar-produto" : "novo-produto"} className="rounded-2xl border border-[color:var(--line)] bg-white p-4"><h2 className="mb-4 font-serif text-2xl">{editing ? `Editar · ${editing.name}` : "Novo produto"}</h2><ProductEditor product={editing} brands={brands} categories={categories} types={types} />{editing ? <ProductDelete id={editing.id} /> : null}</section> : null}
      <HomeFeaturedProducts products={products.filter((p) => p.active).map((p) => ({ id: p.id, name: p.name, brandName: p.brand.name }))} initialSelectedIds={products.filter((p) => p.active && p.homeFeatured).map((p) => p.id)} saved={params.preferidos === "guardados"} />
      <section className="rounded-2xl border border-[color:var(--line)] bg-white p-3 sm:p-4">
        <h2 className="mb-3 font-serif text-xl">Organizar produtos</h2>
        <div className="flex flex-wrap gap-1.5">{[...primaryAdminProductGroups, ...(products.some((p) => getAdminProductGroup(p) === "outros") ? [{ value: "outros" as const, label: "Outros" }] : [])].map((item) => <Link key={item.value} aria-current={group === item.value ? "page" : undefined} href={buildProductsAdminHref({ brandSlug, query, group: item.value })} className={`rounded-xl border px-3 py-2 text-xs ${group === item.value ? "bg-[color:var(--atlantic)] text-white" : "border-[color:var(--line)]"}`}>{item.label}</Link>)}</div>
        <form className="mt-3 flex flex-wrap gap-2" action="/admin/produtos"><input type="hidden" name="tipo" value={group} /><input name="q" aria-label="Pesquisar produtos" placeholder="Pesquisar produto, marca ou categoria..." defaultValue={query} className="h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm" /><select name="marca" aria-label="Marca dos produtos" defaultValue={brandSlug} className="h-10 max-w-full rounded-xl border px-3 text-sm"><option value="">Todas as marcas</option>{brands.map((b) => <option key={b.id} value={b.slug}>{b.name}</option>)}</select><button className="rounded-xl border px-3 text-sm">Filtrar</button><Link href="/admin/produtos" className="rounded-xl px-3 py-3 text-xs underline">Limpar</Link></form>
      </section>
      <section className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-white">
        {visible.map((p) => <div key={p.id} className="flex items-center gap-3 border-b border-[color:var(--line)] p-3"><Image src={p.imageUrl || "/logo-9-ilhas.svg"} alt="" width={44} height={52} unoptimized className="h-13 w-11 shrink-0 rounded-lg object-contain" /><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{p.name}</h3><p className="text-xs text-slate-500">{p.brand.name} · {p.sizeLabel} · {p.category.name}</p><p className="text-xs text-slate-600">{formatPrice(p.salePriceInCents ?? p.priceInCents)} · Stock {p.stock}{!p.active ? " · Inativo" : ""}{p.featured ? " · Destacado" : ""}{p.bestseller ? " · Bestseller" : ""}</p></div><Link href={`/admin/produtos?editar=${p.id}#editar-produto`} className="shrink-0 rounded-xl border px-3 py-3 text-xs">Editar</Link></div>)}
        {!visible.length ? <p className="p-6 text-sm text-slate-500">Nenhum produto encontrado.</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs"><span>{filtered.length} produtos · Página {page}/{pages}</span><div className="flex gap-3">{page > 1 ? <Link href={pageHref(page - 1)} className="rounded-lg border p-3">Anterior</Link> : null}{page < pages ? <Link href={pageHref(page + 1)} className="rounded-lg border p-3">Seguinte</Link> : null}</div></div>
      </section>
    </div>
  </AdminShell>;
}
