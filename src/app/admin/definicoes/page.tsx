import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPushSettings } from "@/components/admin/admin-push-settings";
export default async function SettingsPage() {
  await requireAdmin();
  return <AdminShell title="Definições" description="Instalação e notificações do Admin."><div className="space-y-4"><section className="rounded-2xl border bg-white p-5"><h2 className="text-xl">Instalar no iPhone</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm"><li>Abra o Admin no Safari e inicie sessão.</li><li>Toque em Partilhar → Adicionar ao ecrã principal.</li><li>Confirme o nome 9 Ilhas Admin e abra pelo novo ícone.</li></ol><p className="mt-3 text-sm text-slate-500">A aplicação precisa de internet. Os dados privados não são guardados para utilização offline. As notificações no iPhone requerem iOS 16.4 ou posterior e abertura pelo ícone instalado.</p></section><AdminPushSettings /><Link href="/admin/loja/definicoes" className="inline-flex min-h-11 items-center rounded-xl border bg-white px-4 text-sm">Definições da loja e redes sociais</Link></div></AdminShell>;
}
