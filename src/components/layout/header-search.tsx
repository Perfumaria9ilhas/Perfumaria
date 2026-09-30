"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { trackInternalSearch } from "@/lib/internal-analytics";

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  brand: string;
  priceInCents: number;
};

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const trackedQuery = useRef("");

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  useEffect(() => {
    const normalized = query.trim();
    if (!open || !normalized) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/catalog-search?q=${encodeURIComponent(normalized)}`, {
        signal: controller.signal,
      });
      if (!response.ok) return;
      const data = (await response.json()) as { products: SearchResult[] };
      setResults(data.products);
      if (normalized.length >= 2 && trackedQuery.current !== normalized.toLocaleLowerCase("pt-PT")) {
        trackedQuery.current = normalized.toLocaleLowerCase("pt-PT");
        trackInternalSearch(normalized, data.products.length);
      }
    }, 160);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--ink)] transition hover:bg-[color:var(--sand-soft)]"
        aria-label="Pesquisar perfumes"
      >
        <Search className="h-[1.15rem] w-[1.15rem]" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] bg-black/30 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-[2px] sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pesquisar produtos"
            className="mx-auto mt-1 w-full max-w-2xl overflow-hidden rounded-[1.1rem] bg-white shadow-[0_28px_90px_rgba(20,16,13,0.24)] sm:mt-16"
          >
            <div className="flex items-center gap-3 border-b border-[color:var(--line)] px-4">
              <Search className="h-5 w-5 shrink-0 text-[color:var(--gold)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (!event.target.value.trim()) setResults([]);
                }}
                placeholder="Pesquisar perfumes…"
                className="h-16 min-w-0 flex-1 bg-transparent text-base text-[color:var(--ink)] outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[color:var(--sand-soft)]"
                aria-label="Fechar pesquisa"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {query.trim() ? (
              <div className="max-h-[min(65svh,32rem)] overflow-y-auto p-2">
                {results.length ? results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/catalogo?produto=${encodeURIComponent(product.slug)}`}
                    onClick={() => setOpen(false)}
                    className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-2 transition hover:bg-[color:var(--sand-soft)]"
                  >
                    <div className="relative h-16 overflow-hidden rounded-lg bg-[color:#faf8f4]">
                      {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="64px" className="object-contain p-1" /> : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[9px] uppercase tracking-[0.18em] text-[color:var(--gold)]">{product.brand}</p>
                      <p className="truncate font-serif text-base text-[color:var(--ink)]">{product.name}</p>
                    </div>
                    <strong className="text-sm text-[color:var(--ink)]">{formatPrice(product.priceInCents)}</strong>
                  </Link>
                )) : (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">Nenhum produto encontrado.</p>
                )}
                <Link
                  href={`/catalogo?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setOpen(false)}
                  className="mt-2 flex min-h-12 items-center justify-center border-t border-[color:var(--line)] px-4 pt-3 text-sm font-semibold text-[color:var(--ink)] hover:text-[color:var(--gold)]"
                >
                  Ver todos os resultados
                </Link>
              </div>
            ) : (
              <p className="px-5 py-6 text-sm text-slate-500">Pesquise por nome, marca, inspiração, descrição ou público.</p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
