import Link from "next/link";
import {
  createCustomerAccount,
  loginCustomer,
  logoutCustomer,
} from "@/actions/admin";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{
    registered?: string;
    login?: string;
    loginError?: string;
    registerError?: string;
  }>;
}) {
  const params = await searchParams;
  const currentCustomer = await getCurrentCustomer();
  const customerProfile = currentCustomer
    ? await prisma.customerAccount.findUnique({
        where: { id: currentCustomer.id },
      })
    : null;

  const openRegister = params.registerError === "1";

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-4 lg:px-5 lg:py-6">
      <section className="rounded-[2.4rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,_#fffdf9,_#f5eadb)] p-6 shadow-[0_24px_70px_rgba(74,51,32,0.1)] lg:p-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--atlantic)]">
            Conta de cliente
          </p>
          <h1 className="mt-3 font-serif text-5xl text-[color:var(--ink)]">
            Entrar ou criar conta
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Pode continuar a navegar, ver preços, adicionar ao carrinho e enviar pedidos sem conta.
            Se preferir, pode criar uma conta para guardar os seus dados e associar os pedidos ao
            seu perfil.
          </p>
        </div>

        {params.registered === "1" ? (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            Conta criada com sucesso e sessão iniciada.
          </div>
        ) : null}

        {params.login === "1" ? (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            Sessão iniciada com sucesso.
          </div>
        ) : null}

        {params.loginError === "1" ? (
          <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            Não foi possível entrar. Verifique o email e a palavra-passe.
          </div>
        ) : null}

        {params.registerError === "1" ? (
          <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            Não foi possível criar a conta. Confirme os dados e a confirmação da palavra-passe.
          </div>
        ) : null}

        {customerProfile ? (
          <section className="mt-8 rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--atlantic)]">
                  Sessão ativa
                </p>
                <h2 className="mt-2 font-serif text-4xl text-[color:var(--ink)]">
                  {customerProfile.firstName} {customerProfile.lastName}
                </h2>
                <p className="mt-3 text-sm text-slate-600">{customerProfile.email}</p>
                <p className="text-sm text-slate-600">{customerProfile.phone}</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  {customerProfile.address}
                </p>
              </div>
              <form action={logoutCustomer}>
                <button className="rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)]">
                  Terminar sessão
                </button>
              </form>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="rounded-full bg-[color:var(--atlantic)] px-6 py-3 text-sm font-semibold text-white"
              >
                Continuar no catálogo
              </Link>
              <p className="self-center text-sm text-slate-500">
                Os próximos pedidos ficam associados a esta conta.
              </p>
            </div>
          </section>
        ) : (
          <div className="mt-8 space-y-6">
            <section className="rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
                <div className="max-w-xl">
                  <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--atlantic)]">
                    Entrar
                  </p>
                  <h2 className="mt-3 font-serif text-4xl text-[color:var(--ink)]">
                    Já tenho conta
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    Entre com o seu email e palavra-passe. Os pedidos que fizer a partir daqui ficam
                    ligados à sua ficha de cliente.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-[rgba(185,154,118,0.16)] bg-[linear-gradient(180deg,_rgba(255,249,242,0.78),_rgba(255,255,255,0.92))] p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--atlantic)]">
                    Ainda não tem conta?
                  </p>
                  <h3 className="mt-2 font-serif text-3xl text-[color:var(--ink)]">
                    Crie a sua conta aqui.
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Abra o registo logo abaixo e a conta fica guardada no sistema para depois poder
                    entrar normalmente sempre que quiser.
                  </p>
                </div>
              </div>

              <form action={loginCustomer} className="mt-6 grid gap-4">
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-4"
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Palavra-passe"
                  className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-4"
                  required
                />
                <button className="rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-6 py-3 text-sm font-semibold text-[color:var(--ink)]">
                  Entrar
                </button>
              </form>
            </section>

            <details
              open={openRegister}
              className="group rounded-[2rem] border border-[color:var(--line)] bg-white shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                <div className="max-w-2xl">
                  <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--atlantic)]">
                    Registar
                  </p>
                  <h2 className="mt-2 font-serif text-3xl text-[color:var(--ink)]">
                    Criar conta
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Abra o formulário, preencha uma vez e a conta fica gravada para depois poder
                    entrar sem problemas.
                  </p>
                </div>
                <span className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white">
                  Abrir registo
                </span>
              </summary>

              <div className="border-t border-[color:var(--line)] px-6 py-6">
                <form action={createCustomerAccount} className="grid gap-4 md:grid-cols-2">
                  <input
                    name="firstName"
                    placeholder="Primeiro nome"
                    className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-4"
                    required
                  />
                  <input
                    name="lastName"
                    placeholder="Último nome"
                    className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-4"
                    required
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-4 md:col-span-2"
                    required
                  />
                  <input
                    name="phone"
                    placeholder="Número de telefone"
                    className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-4 md:col-span-2"
                    required
                  />
                  <textarea
                    name="address"
                    placeholder="Morada"
                    className="min-h-28 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 md:col-span-2"
                    required
                  />
                  <input
                    name="password"
                    type="password"
                    placeholder="Palavra-passe"
                    className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-4"
                    required
                  />
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirmar palavra-passe"
                    className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-4"
                    required
                  />
                  <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center">
                    <button className="rounded-full bg-[color:var(--atlantic)] px-6 py-3 text-sm font-semibold text-white">
                      Criar conta
                    </button>
                    <Link
                      href="/catalogo"
                      className="rounded-full border border-[color:var(--line)] bg-white px-6 py-3 text-sm font-semibold text-[color:var(--ink)]"
                    >
                      Continuar sem conta
                    </Link>
                  </div>
                </form>
              </div>
            </details>
          </div>
        )}
      </section>
    </div>
  );
}
