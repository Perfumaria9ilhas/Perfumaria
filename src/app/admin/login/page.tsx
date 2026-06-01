import Image from "next/image";
import { AdminLoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,_rgba(16,37,59,0.98),_rgba(15,93,122,0.92),_rgba(63,125,99,0.76))] px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.25)] lg:grid-cols-[1fr_430px]">
        <div className="hidden p-10 text-white lg:block">
          <Image
            src="/logo-9-ilhas.svg"
            alt="9 Ilhas Perfumaria"
            width={280}
            height={76}
            className="h-auto w-52 brightness-[1.15]"
            priority
          />
          <h1 className="mt-4 font-serif text-6xl leading-none">
            Gestão simples para um catálogo premium.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-white/80">
            Entrar no painel para gerir marcas, categorias e produtos que
            aparecem automaticamente no catálogo público.
          </p>
        </div>
        <div className="bg-[color:var(--sand-soft)] p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
            Área admin
          </p>
          <h2 className="mt-3 font-serif text-4xl text-[color:var(--ink)]">
            Iniciar sessão
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Credenciais iniciais vindas do seed. Idealmente devem ser alteradas
            através das variáveis de ambiente.
          </p>
          <div className="mt-8">
            <AdminLoginForm hasError={params.error === "1"} />
          </div>
        </div>
      </div>
    </div>
  );
}
