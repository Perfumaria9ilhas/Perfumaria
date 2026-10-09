import { requireSuperadmin } from "@/lib/auth";
import { listAccounts } from "@/lib/account-management";
import { AdminShell } from "@/components/admin/admin-shell";
import { UserManager } from "@/components/admin/user-manager";
export default async function UsersPage() {
  await requireSuperadmin();
  return <AdminShell title="Utilizadores" description="Gerir contas registadas, acessos e pedidos de eliminação."><UserManager initialAccounts={await listAccounts()} /></AdminShell>;
}
