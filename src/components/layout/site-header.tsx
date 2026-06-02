"use client";

import Link from "next/link";
import {
  Camera,
  Globe2,
  Menu,
  MessageCircleMore,
  Music2,
  ShoppingBag,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { BrandLogo } from "@/components/layout/brand-logo";
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

export function SiteHeader({ settings, socialLinks, currentCustomer }: SiteHeaderProps) {
  const pathname = usePathname();
  const { itemCount, total, openCart, hasHydrated } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileLinks = [
    ...navigationLinks,
    { href: "/conta", label: currentCustomer ? `Olá, ${currentCustomer.firstName}` : "Login" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[color:var(--line)] bg-white/92 backdrop-blur-xl">
        <div className="mx-auto max-w-[1180px] px-4 py-2 lg:px-4.5 lg:py-2.5">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="relative z-20 flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] text-[color:var(--ink)] shadow-sm pointer-events-auto"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <button
              type="button"
              onClick={openCart}
              title={`Abrir carrinho da ${settings.storeName}`}
              className="relative z-20 flex min-w-0 select-none items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-3 py-2 shadow-sm pointer-events-auto"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--atlantic)] shadow-sm">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <span className="min-w-0 text-left text-sm font-semibold text-[color:var(--ink)]">
                {hasHydrated ? itemCount : 0}
              </span>
              <strong className="font-serif text-base text-[color:var(--ink)]">
                {formatPrice(hasHydrated ? total : 0)}
              </strong>
            </button>

            <BrandLogo compact className="shrink-0" />
          </div>

          {mobileMenuOpen ? (
            <nav className="mt-3 grid gap-2 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-3 shadow-[0_14px_30px_rgba(92,68,47,0.08)] lg:hidden">
              {mobileLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "rounded-full px-3.5 py-2.5 text-center text-sm font-medium transition",
                    pathname === link.href
                      ? "bg-[color:var(--gold)] text-white shadow-sm"
                      : "bg-white text-slate-700 hover:bg-[color:var(--sand-soft)] hover:text-[color:var(--ink)]",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="hidden flex-col gap-2.5 lg:flex">
            <div className="flex items-center justify-between gap-4">
              <BrandLogo />

              <div className="flex items-center gap-2.5">
                {socialLinks.map(({ href, label }) =>
                  href ? (
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
                  ) : null,
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <nav className="flex flex-wrap gap-1.5">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-full px-3 py-1.25 text-sm font-medium transition",
                      pathname === link.href
                        ? "bg-[color:var(--gold)] text-white shadow-sm"
                        : "text-slate-600 hover:bg-[color:var(--sand-soft)] hover:text-[color:var(--ink)]",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/conta"
                className="rounded-full px-3 py-1.25 text-sm font-medium text-slate-600 transition hover:bg-[color:var(--sand-soft)] hover:text-[color:var(--ink)]"
                >
                  {currentCustomer ? `Olá, ${currentCustomer.firstName}` : "Login"}
                </Link>
              </nav>

              <button
                type="button"
                onClick={openCart}
                title={`Abrir carrinho da ${settings.storeName}`}
                className="flex items-center justify-between gap-3 rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-3.5 py-2 text-left transition hover:border-[color:var(--gold)]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white p-2 text-[color:var(--atlantic)] shadow-sm">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                      Carrinho
                    </p>
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
