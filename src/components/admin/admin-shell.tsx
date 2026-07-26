import Link from "next/link";
import { logoutAdmin } from "@/actions/admin";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/marcas", label: "Marcas" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/tipos-produto", label: "Tipos" },
  { href: "/admin/stock", label: "Stock" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/desejos", label: "Desejos" },
  { href: "/admin/comentarios", label: "Comentarios" },
  { href: "/admin/sobre-nos", label: "Sobre Nos" },
  { href: "/admin/loja", label: "Loja" },
];

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--sand-soft)]">
      <header className="border-b border-[color:var(--line)] bg-[linear-gradient(180deg,_#ffffff,_#fbf7ef)]">
        <div className="mx-auto flex max-w-[1340px] flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
              Admin . 9 Ilhas Perfumaria
            </p>
            <h1 className="font-serif text-3xl text-[color:var(--ink)]">{title}</h1>
            <p className="text-sm text-slate-600">{description}</p>
          </div>

          <div className="hidden flex-wrap gap-2 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-slate-700"
              >
                {link.label}
              </Link>
            ))}
            <form action={logoutAdmin}>
              <button className="rounded-full bg-[color:var(--atlantic)] px-3.5 py-1.5 text-sm font-semibold text-white">
                Terminar sessao
              </button>
            </form>
          </div>

          <details className="rounded-[1.2rem] border border-[color:var(--line)] bg-white lg:hidden">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[color:var(--ink)]">
              Menu admin
            </summary>
            <div className="flex flex-wrap gap-2 border-t border-[color:var(--line)] px-3 py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-slate-700"
                >
                  {link.label}
                </Link>
              ))}
              <form action={logoutAdmin}>
                <button className="rounded-full bg-[color:var(--atlantic)] px-3.5 py-1.5 text-sm font-semibold text-white">
                  Terminar sessao
                </button>
              </form>
            </div>
          </details>
        </div>
      </header>
      <main className="mx-auto max-w-[1340px] px-4 py-6 lg:px-5">
        <div className="mb-5 flex flex-col gap-3 rounded-[1.6rem] border border-[color:var(--line)] bg-white/80 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Alteracoes no admin refletem-se automaticamente no catalogo publico.
          </p>
          <Link
            href="/"
            className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-[color:var(--ink)]"
          >
            Ver loja
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
