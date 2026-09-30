"use client";

import Link from "next/link";
import {
  Camera,
  Globe2,
  MessageCircleMore,
  Menu,
  Music2,
  ShoppingBag,
  X,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { TrackedWhatsAppLink } from "@/components/analytics/tracked-whatsapp-link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { HeaderSearch } from "@/components/layout/header-search";
import { useCart } from "@/components/providers/cart-provider";
import { navigationLinks } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { PublicStoreSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  settings: PublicStoreSettings;
  socialLinks: { href?: string; label: string }[];
  currentCustomer?: {
    firstName: string;
    lastName: string;
  } | null;
};

const topStripItems = [
  "Entrega r\u00e1pida na Ilha Terceira",
  "Todos os dias, das 08h00 \u00e0s 22h00",
  "Envio para A\u00e7ores, Madeira e Portugal Continental",
];

export function SiteHeader({ settings, socialLinks, currentCustomer }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { itemCount, total, openCart, hasHydrated } = useCart();
  const mobileLinks = [
    ...navigationLinks,
    { href: "/conta", label: currentCustomer ? `Ol\u00e1, ${currentCustomer.firstName}` : "Login" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[color:var(--line)] bg-[rgba(255,253,250,0.94)] backdrop-blur-xl">
        <div className="hidden bg-[color:var(--ink)] lg:block">
          <div className="mx-auto flex max-w-[1420px] items-center justify-center gap-10 px-6 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white/82">
            {topStripItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-[1420px] px-4 py-2.5 lg:px-6 lg:py-3">
          <div className="flex min-w-0 items-center justify-between gap-2 lg:hidden">
            <BrandLogo compact className="min-w-0 shrink" />
            <div className="flex items-center gap-1">
              <HeaderSearch />
              <button
              type="button"
              onClick={openCart}
              title={`Abrir carrinho da ${settings.storeName}`}
              className="relative z-20 flex min-w-0 shrink-0 select-none items-center gap-1.5 rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-2 py-2 shadow-sm pointer-events-auto sm:gap-2 sm:px-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--atlantic)] shadow-sm">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <span className="min-w-0 text-left text-sm font-semibold text-[color:var(--ink)]">
                {hasHydrated ? itemCount : 0}
              </span>
              <strong className="hidden font-serif text-base text-[color:var(--ink)] min-[430px]:block">
                {formatPrice(hasHydrated ? total : 0)}
              </strong>
              </button>
              <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--ink)] hover:bg-[color:var(--sand-soft)]" aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileMenuOpen}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen ? <nav className="mt-2 grid min-w-0 grid-cols-2 gap-1 border-t border-[color:var(--line)] pt-2 text-sm lg:hidden">
            {mobileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "min-h-11 rounded-lg px-3 py-3 font-medium transition",
                  pathname === link.href
                    ? "bg-[color:var(--sand-soft)] text-[color:var(--gold)]"
                    : "text-slate-700 hover:bg-[color:var(--sand-soft)] hover:text-[color:var(--ink)]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav> : null}

          <div className="hidden items-center justify-between gap-8 lg:flex">
            <div className="flex shrink-0 items-center gap-5">
              <BrandLogo />

              <div className="flex items-center gap-2">
                {socialLinks.map(({ href, label }) =>
                  href ? (
                    label === "WhatsApp" ? (
                      <TrackedWhatsAppLink
                        key={label}
                        href={href}
                        ariaLabel={label}
                        contentName="WhatsApp header"
                        className="rounded-full border border-[color:var(--line)] p-2 text-slate-500 transition hover:border-[color:var(--gold)] hover:text-[color:var(--atlantic)]"
                      >
                        <MessageCircleMore className="h-4 w-4" />
                      </TrackedWhatsAppLink>
                    ) : (
                      <Link
                        key={label}
                        href={href}
                        target="_blank"
                        className="rounded-full border border-[color:var(--line)] p-2 text-slate-500 transition hover:border-[color:var(--gold)] hover:text-[color:var(--atlantic)]"
                        aria-label={label}
                      >
                        {label === "Instagram" ? (
                          <Camera className="h-4 w-4" />
                        ) : label === "Facebook" ? (
                          <Globe2 className="h-4 w-4" />
                        ) : label === "TikTok" ? (
                          <Music2 className="h-4 w-4" />
                        ) : (
                          <MessageCircleMore className="h-4 w-4" />
                        )}
                      </Link>
                    )
                  ) : null,
                )}
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-5">
              <nav className="flex items-center gap-1">
                <HeaderSearch />
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-medium transition",
                      pathname === link.href
                        ? "bg-[color:var(--ink)] text-white"
                        : "text-slate-600 hover:bg-[color:var(--sand-soft)] hover:text-[color:var(--ink)]",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/conta"
                className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-[color:var(--sand-soft)] hover:text-[color:var(--ink)]"
                >
                  {currentCustomer ? `Ol\u00e1, ${currentCustomer.firstName}` : "Login"}
                </Link>
              </nav>

              <button
                type="button"
                onClick={openCart}
                title={`Abrir carrinho da ${settings.storeName}`}
                className="flex items-center justify-between gap-3 rounded-full border border-[color:var(--line)] bg-white px-3.5 py-2 text-left shadow-[0_4px_16px_rgba(45,35,28,0.04)] transition hover:border-[color:var(--gold)]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white p-2 text-[color:var(--atlantic)] shadow-sm">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Carrinho</p>
                    <p className="text-sm font-semibold leading-5 text-[color:var(--ink)]">
                      {hasHydrated ? itemCount : 0} artigo(s)
                    </p>
                  </div>
                </div>
                <strong className="font-serif text-lg text-[color:var(--ink)]">
                  {formatPrice(hasHydrated ? total : 0)}
                </strong>
              </button>
            </div>
          </div>
        </div>
      </header>
      <CartDrawer />
    </>
  );
}
