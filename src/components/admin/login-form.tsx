import { loginAdmin } from "@/actions/admin";

export function AdminLoginForm({ hasError }: { hasError: boolean }) {
  return (
    <form action={loginAdmin} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--ink)]">Email</label>
        <input
          name="email"
          type="email"
          defaultValue="admin@9ilhas.pt"
          className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 outline-none transition focus:border-[color:var(--atlantic)]"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--ink)]">Palavra-passe</label>
        <input
          name="password"
          type="password"
          defaultValue="noveilhas123"
          className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 outline-none transition focus:border-[color:var(--atlantic)]"
          required
        />
      </div>
      {hasError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          Credenciais inválidas. Confirma o email e a palavra-passe.
        </p>
      ) : null}
      <button className="w-full rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--atlantic-deep)]">
        Entrar no admin
      </button>
    </form>
  );
}
