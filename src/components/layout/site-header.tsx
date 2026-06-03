"use client";

import Link from "next/link";
import {
  Camera,
  Globe2,
  MessageCircleMore,
  Music2,
  ShoppingBag,
} from "lucide-react";
import { usePathname } from "next/navigation";
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
  const mobileLinks = [
    ...navigationLinks,
    { href: "/conta", label: currentCustomer ? `Olá, ${currentCustomer.firstName}` : "Login" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[color:var(--line)] bg-white/92 backdrop-blur-xl">
        <div className="hidden border-b border-[rgba(255,255,255,0.16)] bg-[linear-gradient(90deg,_#ba8a48,_#d5ad6b)] lg:block">
          <div className="mx-auto flex max-w-[1320px] items-center justify-center gap-8 px-5 py-2 text-[11px] font-medium text-white">
            <span>Entrega rápida na Ilha Terceira</span>
            <span>Todos os dias das 08h00 as 22h00</span>
            <span>Envio para todas as ilhas dos Acores</span>
          </div>
        </div>
        <div className="mx-auto max-w-[1320px] px-4 py-2 lg:px-5 lg:py-2.5">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <BrandLogo compact className="shrink-0" />

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
          </div>

          <nav className="mt-2.5 flex items-center gap-4 overflow-x-auto whitespace-nowrap pb-1 text-sm lg:hidden">
            {mobileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 border-b px-0 pb-1 font-medium transition",
                  pathname === link.href
                    ? "border-[color:var(--gold)] text-[color:var(--gold)]"
                    : "border-transparent text-slate-700 hover:border-[rgba(183,146,107,0.45)] hover:text-[color:var(--ink)]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

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
