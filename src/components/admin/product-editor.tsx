"use client";

import { deleteProduct, saveProduct } from "@/actions/admin";
import { productAudienceOptions } from "@/lib/product-audience";
import type { Product } from "@prisma/client";

const input = "h-10 w-full min-w-0 rounded-xl border border-[color:var(--line)] bg-white px-3 text-sm";
export function ProductEditor({ product, brands, categories, types }: { product?: Product; brands: { id: string; name: string }[]; categories: { id: string; name: string }[]; types: { id: string; name: string }[] }) {
  const euro = (value?: number | null) => value == null ? "" : (value / 100).toFixed(2).replace(".", ",");
  function section(title: string, children: React.ReactNode) {
    return <details open={title === "Informação"} className="rounded-xl border border-[color:var(--line)] bg-white"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold">{title}</summary><div className="grid gap-3 border-t border-[color:var(--line)] p-4 sm:grid-cols-2">{children}</div></details>;
  }
  function field(label: string, children: React.ReactNode) { return <label className="block min-w-0 space-y-1 text-xs text-slate-600"><span>{label}</span>{children}</label>; }
  function select(name: string, label: string, items: { id: string; name: string }[], value?: string) { return field(label, <select name={name} defaultValue={value ?? ""} required className={input}><option value="">Selecionar...</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>); }
  return <form action={saveProduct} className="space-y-3" onInvalidCapture={(e) => { const details = (e.target as HTMLElement).closest("details"); if (details) { details.open = true; } }}>
    {product ? <><input type="hidden" name="id" value={product.id} /><input type="hidden" name="currentImageUrl" value={product.imageUrl} /></> : null}
    {section("Informação", <>
      {field("Nome", <input name="name" defaultValue={product?.name} required className={input} />)}
      {select("brandId", "Marca", brands, product?.brandId)}
      {select("categoryId", "Categoria", categories, product?.categoryId)}
      {field("Público", <select name="audience" defaultValue={product?.audience ?? "UNISSEXO"} required className={input}>{productAudienceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>)}
      {select("productTypeId", "Tipo", types, product?.productTypeId)}
      {field("Volume / tamanho", <input name="sizeLabel" defaultValue={product?.sizeLabel ?? "100 ml"} required className={input} />)}
    </>)}
    {section("Preço e stock", <>
      {field("Preço base (€)", <input name="priceInEuros" inputMode="decimal" defaultValue={euro(product?.priceInCents)} required className={input} />)}
      {field("Preço promocional (€)", <input name="salePriceInEuros" inputMode="decimal" defaultValue={euro(product?.salePriceInCents)} className={input} />)}
      {field("Stock", <input name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} required className={input} />)}
    </>)}
    {section("Imagem e descrição", <>
      {field("Imagem", <input name="imageFile" type="file" accept="image/*" className="block w-full min-w-0 text-xs" />)}
      {field("Descrição", <textarea name="description" defaultValue={product?.description} required className="min-h-24 w-full rounded-xl border p-3 text-sm" />)}
      {field("Inspirado em", <input name="inspiredBy" defaultValue={product?.inspiredBy ?? ""} className={input} />)}
      {field("Duração", <input name="durationLabel" defaultValue={product?.durationLabel ?? ""} className={input} />)}
    </>)}
    {section("Disponibilidade", <>
      {([ ["availableInFiveMl", "Disponível em 5 ml", product?.availableInFiveMl ?? true], ["availableInTenMl", "Disponível em 10 ml", product?.availableInTenMl ?? false], ["active", "Ativo", product?.active ?? true], ["featured", "Destacado", product?.featured ?? false], ["bestseller", "Bestseller", product?.bestseller ?? false] ] as const).map(([name, label, checked]) => <label key={name} className="flex min-h-10 items-center gap-2 text-sm"><input name={name} type="checkbox" defaultChecked={checked} />{label}</label>)}
      <p className="text-xs leading-relaxed text-slate-500 sm:col-span-2">Regra automática preservada: abaixo de 55 € — 5 ml: 3,50 €, 10 ml: 6,50 €; a partir de 55 € — 5 ml: 4,50 €, 10 ml: 7,50 €.</p>
    </>)}
    <div className="flex flex-wrap gap-2"><a href="/admin/produtos" className="rounded-xl border px-4 py-3 text-sm">Cancelar</a><button className="rounded-xl bg-[color:var(--atlantic)] px-4 py-3 text-sm text-white">{product ? "Atualizar produto" : "Guardar produto"}</button></div>
  </form>;
}

export function ProductDelete({ id }: { id: string }) { return <form action={deleteProduct} onSubmit={(event) => { if (!window.confirm("Eliminar definitivamente este produto? Esta ação não pode ser anulada.")) event.preventDefault(); }}><input type="hidden" name="id" value={id} /><button className="mt-4 text-xs text-red-700 underline">Eliminar produto</button></form>; }
