"use client";
import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { type AdminStockRow, normalizeStockSearch } from "@/lib/stock";
import { formatPrice } from "@/lib/format";
export function SearchableProductSelect({
  name,
  products,
  placeholder,
  required = true,
  initialProductId = "",
  onSelection,
  onQuery,
  initialQuery,
  ariaLabel,
}: {
  name: string;
  products: AdminStockRow[];
  placeholder: string;
  required?: boolean;
  initialProductId?: string;
  onSelection?: (id: string) => void;
  onQuery?: (query: string) => void;
  initialQuery?: string;
  ariaLabel?: string;
}) {
  const initialProduct = products.find((product) => product.id === initialProductId);
  const [query, setQuery] = useState(initialQuery ?? (initialProduct ? `${initialProduct.name} · ${initialProduct.brandName}` : ""));
  const listboxId = useId();
  const [selectedId, setSelectedId] = useState(initialProductId);
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const normalizedQuery = normalizeStockSearch(query);
    const ordered = [...products].sort((left, right) =>
      left.name.localeCompare(right.name, "pt-PT"),
    );
    if (!normalizedQuery) return ordered.slice(0, 30);
    return ordered.filter((product) =>
      normalizeStockSearch(`${product.name} ${product.brandName}`).includes(normalizedQuery),
    ).slice(0, 30);
  }, [products, query]);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selectedId} />
      <input
        value={query}
        required={required}
        autoComplete="off"
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedId("");
          onSelection?.("");
          onQuery?.(event.target.value);
          setOpen(true);
        }}
        className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 pr-10 text-[color:var(--ink)]"
      />
      <Search className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-slate-400" />
      {open ? (
        <div id={listboxId} role="listbox" className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-[color:var(--line)] bg-white p-2 shadow-xl">
          {matches.length ? matches.map((product) => (
            <button
              key={product.id}
              type="button"
              role="option"
              aria-selected={selectedId === product.id}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                setSelectedId(product.id);
                onSelection?.(product.id);
                onQuery?.(`${product.name} · ${product.brandName}`);
                setQuery(`${product.name} · ${product.brandName}`);
                setOpen(false);
              }}
              className="block w-full rounded-xl px-3 py-3 text-left text-sm text-[color:var(--ink)] hover:bg-[color:var(--sand-soft)]"
            >
              <span className="font-medium">{product.name}</span>
              <span className="ml-1 text-slate-500">· {product.brandName} · {product.sizeLabel || "100 ml"} · {formatPrice(product.salePriceInCents)}</span>
            </button>
          )) : (
            <p className="px-3 py-4 text-sm text-slate-500">Nenhum perfume encontrado.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
