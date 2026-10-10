"use client";

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { Heart, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PublicDialog } from "@/components/store/public-dialog";
import type { CatalogProduct } from "@/lib/types";

type Favorite = Pick<CatalogProduct, "id" | "slug" | "name" | "imageUrl"> & { brandName: string };
const key = "nineilhas-favorites";
const FavoritesContext = createContext<{ items: Favorite[]; toggle: (product: CatalogProduct) => void; open: () => void } | null>(null);
function readFavorites(): Favorite[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is Favorite => typeof item?.id === "string" && typeof item?.slug === "string" && typeof item?.name === "string" && typeof item?.imageUrl === "string" && typeof item?.brandName === "string") : [];
  } catch { return []; }
}
export function FavoritesProvider({ children, accountId = null }: { children: ReactNode; accountId?: string | null }) {
  const [items, setItems] = useState<Favorite[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        if (!accountId) { setItems(readFavorites()); setLoaded(true); return; }
        const response = await fetch("/api/account/favorites", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || data.accountId !== accountId) throw new Error();
        const guest = readFavorites();
        if (guest.length) {
          const merged = await fetch("/api/account/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: guest.slice(0, 200).map(p => p.id) }) });
          if (!merged.ok) throw new Error();
          data.items = (await merged.json()).items;
          try { localStorage.removeItem(key); } catch { /* Browser storage may be disabled. */ }
        }
        if (!cancelled) { setItems(data.items); setLoaded(true); }
      } catch { if (!cancelled) setError("Não foi possível carregar os favoritos da conta. Atualize a página."); }
    }, 0);
    const sync = () => { if (!accountId) setItems(readFavorites()); };
    window.addEventListener("storage", sync);
    return () => { cancelled = true; clearTimeout(timer); window.removeEventListener("storage", sync); };
  }, [accountId]);
  useEffect(() => { if (loaded && !accountId) { try { localStorage.setItem(key, JSON.stringify(items)); } catch { /* Selection still works without browser storage. */ } } }, [items, loaded, accountId]);
  async function select(productId: string, selected: boolean, product?: CatalogProduct) {
    if (!loaded || saving.current) return;
    setError("");
    if (accountId) {
      saving.current = true;
      try {
        const res = await fetch("/api/account/favorites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, selected }) });
        const data = await res.json(); if (!res.ok) throw new Error(data.error);
        setItems(data.items);
      } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível guardar o favorito."); }
      finally { saving.current = false; }
    } else setItems(current => !selected ? current.filter(p => p.id !== productId) : product ? [...current.filter(p => p.id !== productId), { id: product.id, slug: product.slug, name: product.name, imageUrl: product.imageUrl, brandName: product.brand.name }] : current);
  }
  function toggle(product: CatalogProduct) { void select(product.id, !items.some(p => p.id === product.id), product); }
  return <FavoritesContext.Provider value={{ items, toggle, open: () => setOpen(true) }}>
    {children}
    <PublicDialog open={isOpen} onClose={() => setOpen(false)} title="Os seus favoritos" className="store-drawer">
      <button className="store-icon store-dialog-close" aria-label="Fechar favoritos" onClick={() => setOpen(false)}><X size={20} /></button>
      <p className="store-muted">{accountId ? "Guardados na sua conta." : "Guardados neste browser."} Consulte o produto para ver o preço e a disponibilidade atuais.</p>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <div className="store-favorites-list">
        {items.length ? items.map((item) => <div className="store-favorite-row" key={item.id}>
          <Link href={`/catalogo?produto=${encodeURIComponent(item.slug)}`} onClick={() => setOpen(false)}>
            <span className="store-favorite-photo">{item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-contain" /> : <Heart />}</span>
            <span><strong>{item.name}</strong><small>{item.brandName}</small></span>
          </Link>
          <button className="store-icon" aria-label={`Remover ${item.name} dos favoritos`} onClick={() => void select(item.id, false)}><X size={18} /></button>
        </div>) : <p className="store-empty">Toque no coração de um produto para o guardar aqui.</p>}
      </div>
      <Link className="store-button" href="/catalogo" onClick={() => setOpen(false)}>Explorar catálogo</Link>
    </PublicDialog>
  </FavoritesContext.Provider>;
}
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("FavoritesProvider em falta");
  return context;
}
export function FavoriteButton({ product }: { product: CatalogProduct }) {
  const { items, toggle } = useFavorites();
  const selected = items.some((item) => item.id === product.id);
  return <button type="button" className="store-icon store-heart" aria-label={`${selected ? "Remover" : "Guardar"} ${product.name} ${selected ? "dos" : "nos"} favoritos`} aria-pressed={selected} onClick={() => toggle(product)}><Heart size={18} fill={selected ? "currentColor" : "none"} /></button>;
}
