"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Boxes, ChevronRight, CircleUserRound, FileText, FolderOpen, Heart, House, LogOut, MessageSquare, PackageSearch, Store, Tags } from "lucide-react";
import { AdminNotifications } from "./admin-notifications";
import { ClipboardList, Ellipsis } from "lucide-react";
import { logoutAdmin } from "@/actions/admin";
import { useAdminAccess } from "./admin-access";

type AdminNavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type AdminNavSection = { label: string; items: AdminNavItem[] };

const navSections: AdminNavSection[] = [
  { label: "Principal", items: [
    { href: "/admin", label: "Dashboard", icon: House },
    { href: "/admin/estatisticas", label: "Estatísticas", icon: BarChart3 },
  ] },
  { label: "Gestão", items: [
    { href: "/admin/stock?view=stock", label: "Stock", icon: Boxes },
    { href: "/admin/produtos", label: "Produtos", icon: PackageSearch },
    { href: "/admin/descontos", label: "Descontos", icon: Tags },
  ] },
  { label: "Catálogo", items: [
    { href: "/admin/marcas", label: "Marcas", icon: Tags },
    { href: "/admin/categorias", label: "Categorias", icon: FolderOpen },
    { href: "/admin/tipos-produto", label: "Tipos", icon: Boxes },
  ] },
  { label: "Site", items: [
    { href: "/admin/loja", label: "Página inicial", icon: House },
    { href: "/admin/desejos", label: "Desejos", icon: Heart },
    { href: "/admin/comentarios", label: "Comentários", icon: MessageSquare },
    { href: "/", label: "Ver loja", icon: Store },
    { href: "/admin/sobre-nos", label: "Sobre Nós", icon: FileText },
  ] },
];

export function AdminShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const access = useAdminAccess();
  const sections = access?.role === "SUPERADMIN" ? [...navSections, { label: "Acessos", items: [{ href: "/admin/utilizadores", label: "Utilizadores", icon: CircleUserRound }] }] : navSections;
  const pathname = usePathname();
  const [currentUrl, setCurrentUrl] = useState(pathname);

  useEffect(() => {
    const syncCurrentUrl = () => setCurrentUrl(`${window.location.pathname}${window.location.search}`);
    const initialSync = window.setTimeout(syncCurrentUrl, 0);
    window.addEventListener("popstate", syncCurrentUrl);
    window.addEventListener("admin-view-change", syncCurrentUrl);
    return () => { window.clearTimeout(initialSync); window.removeEventListener("popstate", syncCurrentUrl); window.removeEventListener("admin-view-change", syncCurrentUrl); };
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/admin") return currentUrl === "/admin";
    if (href.startsWith("/admin/stock?")) {
      if (pathname !== "/admin/stock") return false;
      const view = new URLSearchParams(currentUrl.split("?")[1] ?? "").get("view") ?? "stock";
      return new URLSearchParams(href.split("?")[1]).get("view") === view;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const closeAndTrack = (href: string) => { setCurrentUrl(href); };

  const navigation = (mobile: boolean) => <>
    <nav className="flex-1 space-y-5 px-4 py-5" aria-label={mobile ? "Navegação móvel do admin" : "Navegação do admin"}>
      {sections.map((section) => <section key={section.label}>
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

  return <div className="admin-app min-h-screen overflow-x-hidden bg-[color:var(--sand-soft)]">
    <header className="admin-mobile-header lg:hidden">
      <Link href="/admin" aria-label="9 Ilhas Admin"><Image src="/admin-pwa/icon-192.png" alt="" width={28} height={28} unoptimized /><span>9 ILHAS ADMIN</span></Link>
      <AdminNotifications />
    </header>
    <nav className="admin-bottom-nav lg:hidden" aria-label="Navegação principal mobile">
      {[
        { href: "/admin", label: "Início", icon: House },
        { href: "/admin/stock?view=sales&period=all", label: "Vendas", icon: ClipboardList },
        { href: "/admin/stock?view=stock", label: "Stock", icon: Boxes },
        { href: "/admin/produtos", label: "Produtos", icon: Tags },
        { href: "/admin/mais", label: "Mais", icon: Ellipsis },
      ].map(({href,label,icon:Icon}) => {
        const active = label === "Mais" ? !["/admin", "/admin/stock", "/admin/produtos"].includes(pathname) : isActive(href) || label === "Vendas" && currentUrl.includes("view=new-sale");
        return <Link key={label} href={href} onClick={() => closeAndTrack(href)} aria-current={active ? "page" : undefined}><Icon size={22} /><span>{label}</span></Link>;
      })}
    </nav>

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
          <div className="hidden items-center gap-2 lg:flex"><AdminNotifications /><Link href="/" aria-label="Ver loja" title="Ver loja" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white text-[color:var(--gold)] shadow-sm hover:border-[color:var(--gold)]"><Store className="h-6 w-6" /></Link><Link href="/admin" aria-label="Dashboard do administrador" title="Administrador" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white text-[color:var(--gold)] shadow-sm hover:border-[color:var(--gold)]"><CircleUserRound className="h-7 w-7" /></Link></div></div>
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
  const access = useAdminAccess();
  return <div className="flex items-center gap-3"><CircleUserRound className="h-9 w-9 text-[color:var(--gold)]" /><div><p className="text-sm font-semibold text-[color:var(--ink)]">{access?.name ?? "Admin 9 Ilhas"}</p><p className="text-xs text-slate-500">{access?.role === "SUPERADMIN" ? "Superadmin · Protegida" : "Administrador"}</p></div></div>;
}
