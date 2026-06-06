import Link from "next/link";
import { logoutAdmin } from "@/actions/admin";

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
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-slate-700"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/marcas"
              className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-slate-700"
            >
              Marcas
            </Link>
            <Link
              href="/admin/categorias"
              className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-slate-700"
            >
              Categorias
            </Link>
            <Link
              href="/admin/produtos"
              className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-slate-700"
            >
              Produtos
            </Link>
            <Link
              href="/admin/clientes"
              className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-slate-700"
            >
              Clientes
            </Link>
            <Link
              href="/admin/pedidos"
              className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-slate-700"
            >
              Pedidos
            </Link>
            <Link
              href="/admin/desejos"
              className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-slate-700"
            >
              Desejos
            </Link>
            <Link
              href="/admin/comentarios"
              className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-slate-700"
            >
              Comentários
            </Link>
            <Link
              href="/admin/sobre-nos"
              className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-slate-700"
            >
              Sobre Nós
            </Link>
            <Link
              href="/admin/loja"
              className="rounded-full bg-[color:var(--sand-soft)] px-3.5 py-1.5 text-sm text-slate-700"
            >
              Loja
            </Link>
            <form action={logoutAdmin}>
              <button className="rounded-full bg-[color:var(--atlantic)] px-3.5 py-1.5 text-sm font-semibold text-white">
                Terminar sessão
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1340px] px-4 py-6 lg:px-5">
        <div className="mb-5 flex items-center justify-between rounded-[1.6rem] border border-[color:var(--line)] bg-white/80 px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-600">
            Alterações no admin refletem-se automaticamente no catálogo público.
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
