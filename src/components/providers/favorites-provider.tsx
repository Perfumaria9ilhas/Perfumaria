"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Favorite[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => { setItems(readFavorites()); setLoaded(true); }, 0);
    const sync = () => setItems(readFavorites());
    window.addEventListener("storage", sync);
    return () => { clearTimeout(timer); window.removeEventListener("storage", sync); };
  }, []);
  useEffect(() => { if (loaded) { try { localStorage.setItem(key, JSON.stringify(items)); } catch { /* Selection still works when browser storage is unavailable. */ } } }, [items, loaded]);
  function toggle(product: CatalogProduct) {
    if (!loaded) return;
    setItems((current) => current.some((item) => item.id === product.id) ? current.filter((item) => item.id !== product.id) : [...current, { id: product.id, slug: product.slug, name: product.name, imageUrl: product.imageUrl, brandName: product.brand.name }]);
  }
  return <FavoritesContext.Provider value={{ items, toggle, open: () => setOpen(true) }}>
    {children}
    <PublicDialog open={isOpen} onClose={() => setOpen(false)} title="Os seus favoritos" className="store-drawer">
      <button className="store-icon store-dialog-close" aria-label="Fechar favoritos" onClick={() => setOpen(false)}><X size={20} /></button>
      <p className="store-muted">Guardados neste browser. Consulte o produto para ver o preço e a disponibilidade atuais.</p>
      <div className="store-favorites-list">
        {items.length ? items.map((item) => <div className="store-favorite-row" key={item.id}>
          <Link href={`/catalogo?produto=${encodeURIComponent(item.slug)}`} onClick={() => setOpen(false)}>
            <span className="store-favorite-photo">{item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-contain" /> : <Heart />}</span>
            <span><strong>{item.name}</strong><small>{item.brandName}</small></span>
          </Link>
          <button className="store-icon" aria-label={`Remover ${item.name} dos favoritos`} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><X size={18} /></button>
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
