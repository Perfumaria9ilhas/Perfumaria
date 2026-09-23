"use client";

import { useMemo, useState } from "react";
import { saveHomeFeaturedProducts } from "@/actions/admin";

type ProductOption = {
  id: string;
  name: string;
  brandName: string;
};

export function HomeFeaturedProducts({
  products,
  initialSelectedIds,
  saved,
}: {
  products: ProductOption[];
  initialSelectedIds: string[];
  saved: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(initialSelectedIds));
  const [query, setQuery] = useState("");
  const [warning, setWarning] = useState("");

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-PT");
    if (!normalizedQuery) return products;

    return products.filter((product) =>
      `${product.name} ${product.brandName}`
        .toLocaleLowerCase("pt-PT")
        .includes(normalizedQuery),
    );
  }, [products, query]);

  function toggleProduct(productId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
        setWarning("");
        return next;
      }

      if (next.size >= 5) {
        setWarning("Pode selecionar no máximo 5 produtos para a página inicial.");
        return current;
      }

      next.add(productId);
      setWarning("");
      return next;
    });
  }

  return (
    <section className="rounded-[2rem] border border-[color:var(--line)] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-[color:var(--ink)] sm:text-3xl">
            Preferidos na página inicial
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Escolha até 5 produtos ativos para a secção “Os Preferidos dos Nossos Clientes”.
            Produtos sem stock também podem ser selecionados.
          </p>
        </div>
        <span className="w-fit rounded-full bg-[color:var(--sand-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)]">
          {selectedIds.size}/5 selecionados
        </span>
      </div>

      {saved ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Preferidos atualizados na página inicial.
        </p>
      ) : null}

      {warning ? (
        <p role="alert" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {warning}
        </p>
      ) : null}

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Pesquisar produto ou marca"
        className="mt-5 h-12 w-full rounded-2xl border px-4 sm:max-w-md"
      />

      <form action={saveHomeFeaturedProducts} className="mt-4">
        {[...selectedIds].map((productId) => (
          <input key={productId} type="hidden" name="productIds" value={productId} />
        ))}
        <div className="grid max-h-96 gap-2 overflow-y-auto rounded-2xl border border-[color:var(--line)] p-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const checked = selectedIds.has(product.id);
            return (
              <label
                key={product.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition ${
                  checked
                    ? "border-[color:var(--gold)] bg-amber-50/70"
                    : "border-transparent bg-[color:var(--sand-soft)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleProduct(product.id)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <span>
                  <strong className="block font-semibold text-[color:var(--ink)]">{product.name}</strong>
                  <span className="text-xs text-slate-500">{product.brandName}</span>
                </span>
              </label>
            );
          })}
        </div>

        <button className="mt-4 w-full rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white sm:w-auto">
          Guardar preferidos
        </button>
      </form>
    </section>
  );
}
