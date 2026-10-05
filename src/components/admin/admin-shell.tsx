"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Boxes, ChevronRight, CircleUserRound, FileText, FolderOpen, Heart, History, House, LogOut, Menu, MessageSquare, PackageSearch, ShoppingCart, Store, Tags, Users, X } from "lucide-react";
import { logoutAdmin } from "@/actions/admin";

type AdminNavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type AdminNavSection = { label: string; items: AdminNavItem[] };

const navSections: AdminNavSection[] = [
  { label: "Principal", items: [
    { href: "/admin", label: "Dashboard", icon: House },
    { href: "/admin/estatisticas", label: "Estatísticas", icon: BarChart3 },
  ] },
  { label: "Vendas", items: [
    { href: "/admin/stock?view=new-sale", label: "Nova venda", icon: ShoppingCart },
    { href: "/admin/stock?view=sales", label: "Estado das vendas", icon: History },
  ] },
  { label: "Gestão", items: [
    { href: "/admin/stock?view=stock", label: "Stock", icon: Boxes },
    { href: "/admin/produtos", label: "Produtos", icon: PackageSearch },
    { href: "/admin/clientes", label: "Clientes", icon: Users },
    { href: "/admin/desejos", label: "Desejos", icon: Heart },
    { href: "/admin/comentarios", label: "Comentários", icon: MessageSquare },
  ] },
  { label: "Catálogo", items: [
    { href: "/admin/marcas", label: "Marcas", icon: Tags },
    { href: "/admin/categorias", label: "Categorias", icon: FolderOpen },
    { href: "/admin/tipos-produto", label: "Tipos", icon: Boxes },
  ] },
  { label: "Site", items: [
    { href: "/", label: "Ver loja", icon: Store },
    { href: "/admin/sobre-nos", label: "Sobre Nós", icon: FileText },
  ] },
];

export function AdminShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(pathname);

  useEffect(() => {
    const syncCurrentUrl = () => setCurrentUrl(`${window.location.pathname}${window.location.search}`);
    const initialSync = window.setTimeout(syncCurrentUrl, 0);
    window.addEventListener("popstate", syncCurrentUrl);
    window.addEventListener("admin-view-change", syncCurrentUrl);
    return () => { window.clearTimeout(initialSync); window.removeEventListener("popstate", syncCurrentUrl); window.removeEventListener("admin-view-change", syncCurrentUrl); };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [menuOpen]);

  const isActive = (href: string) => {
    if (href === "/admin") return currentUrl === "/admin";
    if (href.startsWith("/admin/stock?")) return currentUrl === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const closeAndTrack = (href: string) => { setCurrentUrl(href); setMenuOpen(false); };

  const navigation = (mobile: boolean) => <>
    <nav className="flex-1 space-y-5 px-4 py-5" aria-label={mobile ? "Navegação móvel do admin" : "Navegação do admin"}>
      {navSections.map((section) => <section key={section.label}>
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">{section.label}</p>
        <div className="space-y-1">{section.items.map((item) => {
          const Icon = item.icon; const active = isActive(item.href);
          return <Link key={item.href} href={item.href} onClick={() => closeAndTrack(item.href)} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${active ? "bg-[color:var(--atlantic)] font-semibold text-white shadow-sm" : "text-[color:var(--ink)] hover:bg-[color:var(--sand-soft)]"}`}>
            <Icon className="h-5 w-5 shrink-0" /><span className="min-w-0 flex-1">{item.label}</span>{active ? <ChevronRight className="h-4 w-4" /> : null}
          </Link>;
        })}</div>
      </section>)}
    </nav>
    <form action={logoutAdmin} className="sticky bottom-0 border-t border-[color:var(--line)] bg-[#fffdf9] p-4"><button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut className="h-5 w-5" />Terminar sessão</button></form>
  </>;

  return <div className="min-h-screen overflow-x-hidden bg-[color:var(--sand-soft)]">
    <header className="border-b border-[color:var(--line)] bg-[linear-gradient(180deg,_#ffffff,_#fbf7ef)] lg:hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu admin" aria-expanded={menuOpen} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[color:var(--line)] bg-white text-[color:var(--ink)] shadow-sm"><Menu className="h-5 w-5" /></button>
        <p className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.2em] text-[color:var(--atlantic)] sm:text-[11px] sm:tracking-[0.26em]">Admin · 9 Ilhas Perfumaria</p>
        <Link href="/" aria-label="Ver loja" title="Ver loja" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--gold)] hover:bg-white"><Store className="h-6 w-6" /></Link>
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu do utilizador" title="Administrador" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--gold)] hover:bg-white"><CircleUserRound className="h-7 w-7" /></button>
      </div>
    </header>

    {menuOpen ? <div className="fixed inset-0 z-[80] lg:hidden">
      <button type="button" aria-label="Fechar menu admin" onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-black/35" />
      <aside role="dialog" aria-modal="true" aria-label="Menu admin" className="absolute inset-y-0 left-0 flex w-[min(86vw,21rem)] flex-col overflow-y-auto border-r border-[color:var(--line)] bg-[#fffdf9] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-[color:var(--line)] bg-[#fffdf9]/95 px-5 pb-4 pt-5 backdrop-blur">
          <div className="flex items-start justify-between gap-3"><AdminIdentity /><button type="button" onClick={() => setMenuOpen(false)} aria-label="Fechar menu admin" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[color:var(--sand-soft)]"><X className="h-5 w-5" /></button></div>
          <div className="mt-4"><AdminUser /></div>
        </div>
        {navigation(true)}
      </aside>
    </div> : null}

    <div className="admin-layout mx-auto min-h-screen max-w-[1600px]">
      <aside className="hidden min-h-screen flex-col border-r border-[color:var(--line)] bg-[#fffdf9] lg:flex">
        <div className="sticky top-0 z-10 border-b border-[color:var(--line)] bg-[#fffdf9]/95 px-5 py-5 backdrop-blur"><AdminIdentity /><div className="mt-4"><AdminUser /></div></div>
        {navigation(false)}
      </aside>

      <div className="min-w-0">
        <header className="border-b border-[color:var(--line)] bg-white/75 px-4 py-4 sm:px-5 lg:px-7 lg:py-5">
          <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="hidden text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)] lg:block">Admin · 9 Ilhas Perfumaria</p>
          <h1 className="font-serif text-3xl leading-tight text-[color:var(--ink)] lg:text-4xl">{title}</h1>
          <p className="max-w-3xl text-sm leading-snug text-slate-600">{description}</p></div>
          <div className="hidden items-center gap-2 lg:flex"><Link href="/" aria-label="Ver loja" title="Ver loja" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white text-[color:var(--gold)] shadow-sm hover:border-[color:var(--gold)]"><Store className="h-6 w-6" /></Link><Link href="/admin" aria-label="Dashboard do administrador" title="Administrador" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white text-[color:var(--gold)] shadow-sm hover:border-[color:var(--gold)]"><CircleUserRound className="h-7 w-7" /></Link></div></div>
        </header>
        <main className="px-3 py-4 sm:px-4 sm:py-6 lg:px-7">
          {children}
        </main>
      </div>
    </div>
  </div>;
}

function AdminIdentity() {
  return <div><p className="font-serif text-2xl tracking-[0.15em] text-[color:var(--gold)]">9 ILHAS</p><p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[color:var(--atlantic)]">Perfumaria · Admin</p></div>;
}

function AdminUser() {
  return <div className="flex items-center gap-3"><CircleUserRound className="h-9 w-9 text-[color:var(--gold)]" /><div><p className="text-sm font-semibold text-[color:var(--ink)]">Admin 9 Ilhas</p><p className="text-xs text-slate-500">Administrador</p></div></div>;
}
