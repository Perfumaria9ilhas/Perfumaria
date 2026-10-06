"use client";
import Link from "next/link";
import { Heart, Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { TrackedWhatsAppLink } from "@/components/analytics/tracked-whatsapp-link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { HeaderSearch } from "@/components/layout/header-search";
import { SocialIcon, socialIconClass } from "@/components/layout/social-icons";
import { useCart } from "@/components/providers/cart-provider";
import { useFavorites } from "@/components/providers/favorites-provider";
import { PublicDialog } from "@/components/store/public-dialog";
import { navigationLinks } from "@/lib/constants";
import type { PublicStoreSettings } from "@/lib/types";
export function SiteHeader({ settings, socialLinks, currentCustomer }: {
 settings: PublicStoreSettings; socialLinks: { href?: string; label: string }[];
 currentCustomer?: { firstName: string; lastName: string } | null;
}) {
 const pathname = usePathname();
 const [menuOpen, setMenuOpen] = useState(false);
 const { itemCount, openCart, hasHydrated } = useCart();
 const favorites = useFavorites();
 return <>
 <header className="store-header"><div className="store-header-inner">
 <button className="store-icon store-menu-toggle" aria-label="Abrir menu" aria-expanded={menuOpen} aria-haspopup="dialog" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
 <BrandLogo className="store-logo" />
 <nav className="store-desktop-nav" aria-label="Navegação principal">{navigationLinks.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}</nav>
 <div className="store-header-search"><HeaderSearch expanded /></div>
 <div className="store-header-actions">
 <button className="store-icon" onClick={favorites.open} aria-label="Abrir favoritos"><Heart size={21} /></button>
 <Link className="store-icon store-account-link" href="/conta" aria-label={currentCustomer ? `Conta de ${currentCustomer.firstName}` : "Login / Conta"}><UserRound size={21} /></Link>
 <button className="store-icon store-cart-toggle" onClick={openCart} aria-label={`Abrir carrinho${hasHydrated && itemCount ? `, ${itemCount} ${itemCount === 1 ? "artigo" : "artigos"}` : ""}`}><ShoppingBag size={21} />{hasHydrated && itemCount > 0 ? <span className="store-count">{itemCount}</span> : null}</button>
 </div></div></header>
 <PublicDialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu da loja" hideTitle className="store-drawer store-menu-drawer">
 <div className="store-menu-heading"><BrandLogo /><button className="store-icon" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><X size={21} /></button></div>
 <nav aria-label="Menu mobile" className="store-menu-links">{[...navigationLinks, { href: "/conta", label: "A minha conta" }].map((link) => <Link key={link.href} href={link.href} className={link.href === "/catalogo" ? "store-menu-catalog" : undefined} aria-current={pathname === link.href ? "page" : undefined} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}</nav>
 <p className="store-muted">{settings.storeName} · Ilha Terceira, Açores</p>
 <div className="store-social-links" aria-label="Redes sociais">{socialLinks.map(({ href, label }) => href ? label === "WhatsApp" ? <TrackedWhatsAppLink key={label} href={href} ariaLabel={label} contentName="WhatsApp menu" className={`store-icon rounded-full ${socialIconClass(label)}`}><SocialIcon label={label} /></TrackedWhatsAppLink> : <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={`store-icon rounded-full ${socialIconClass(label)}`}><SocialIcon label={label} /></a> : null)}</div>
 </PublicDialog><CartDrawer /></>;
}
