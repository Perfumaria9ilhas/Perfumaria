import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { protectedPrincipalId, type AdminIdentity } from "@/lib/auth";

export type AccountKind = "CUSTOMER" | "ADMIN" | "CONFIGURED";
export type ManagedAccount = { id: string; kind: AccountKind; name: string; email: string; role: "CUSTOMER" | "ADMIN" | "SUPERADMIN"; active: boolean; createdAt: string | null; lastLoginAt: string | null; updatedAt: string | null; deletionRequestedAt: string | null; protected: boolean; orders: number };
export async function listAccounts(): Promise<ManagedAccount[]> {
  const [customers, admins, security] = await Promise.all([
    prisma.customerAccount.findMany({ select: { id: true, firstName: true, lastName: true, email: true, role: true, active: true, createdAt: true, lastLoginAt: true, updatedAt: true, deletionRequestedAt: true, _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.adminUser.findMany({ select: { id: true, name: true, email: true, active: true, createdAt: true, lastLoginAt: true, updatedAt: true }, orderBy: { createdAt: "desc" } }),
    prisma.accountSecurity.findUniqueOrThrow({ where: { id: "main" } }),
  ]);
  return [
    { id: security.principalId, kind: "CONFIGURED", name: "Conta principal", email: process.env.ADMIN_EMAIL!, role: "SUPERADMIN", active: true, createdAt: null, lastLoginAt: null, updatedAt: null, deletionRequestedAt: null, protected: true, orders: 0 },
    ...customers.map(c => ({ id: c.id, kind: "CUSTOMER" as const, name: `${c.firstName} ${c.lastName}`, email: c.email, role: c.role, active: c.active, createdAt: c.createdAt.toISOString(), lastLoginAt: c.lastLoginAt?.toISOString() ?? null, updatedAt: c.updatedAt.toISOString(), deletionRequestedAt: c.deletionRequestedAt?.toISOString() ?? null, protected: false, orders: c._count.orders })),
    ...admins.map(a => ({ id: a.id, kind: "ADMIN" as const, name: a.name, email: a.email, role: "ADMIN" as const, active: a.active, createdAt: a.createdAt.toISOString(), lastLoginAt: a.lastLoginAt?.toISOString() ?? null, updatedAt: a.updatedAt.toISOString(), deletionRequestedAt: null, protected: false, orders: 0 })),
  ];
}

export type AccountChange = { id: string; kind: "CUSTOMER" | "ADMIN"; action: "PROMOTE" | "DEMOTE" | "DISABLE" | "ENABLE" | "DELETE" | "DISMISS_REQUEST"; version: string; confirmation?: string };
export async function changeAccount(actor: AdminIdentity, change: AccountChange) {
  if (actor.role !== "SUPERADMIN" || actor.id !== protectedPrincipalId || change.id === protectedPrincipalId) throw new Error("Operação não autorizada. A conta principal está protegida.");
  if (change.action === "DELETE" && change.confirmation !== "ELIMINAR") throw new Error("Confirme a eliminação escrevendo ELIMINAR.");
  if (change.kind === "ADMIN" && ["PROMOTE", "DEMOTE", "DISMISS_REQUEST"].includes(change.action)) throw new Error("Esta operação aplica-se a contas de cliente.");
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT set_config('nineilhas.account_actor', ${actor.id}, true)`;
    if (change.kind === "CUSTOMER") await tx.$queryRaw`SELECT "id" FROM "CustomerAccount" WHERE "id" = ${change.id} FOR UPDATE`;
    else await tx.$queryRaw`SELECT "id" FROM "AdminUser" WHERE "id" = ${change.id} FOR UPDATE`;
    const account = change.kind === "CUSTOMER" ? await tx.customerAccount.findUnique({ where: { id: change.id } }) : await tx.adminUser.findUnique({ where: { id: change.id } });
    if (!account || account.updatedAt.toISOString() !== change.version) throw new Error("A conta mudou. Atualize a lista antes de continuar.");
    const previous = { active: account.active, role: "role" in account ? account.role : "ADMIN", sessionVersion: account.sessionVersion };
    let next: Prisma.InputJsonValue;
    if (change.action === "DELETE") {
      if (change.kind === "CUSTOMER") {
        // Preserve references, dates, totals and all item/financial records.
        // Only contact details and the old free-text WhatsApp message are erased.
        await tx.siteOrder.updateMany({ where: { customerAccountId: account.id }, data: { customerName: "Cliente eliminado", customerEmail: null, customerPhone: null, customerAddress: null, whatsappMessage: "Dados pessoais removidos a pedido de eliminação." } });
        await tx.customerAccount.delete({ where: { id: account.id } });
      } else await tx.adminUser.delete({ where: { id: account.id } });
      await tx.adminPushSubscription.deleteMany({ where: { adminId: account.id } });
      next = { deleted: true, commercialRecordsPreserved: true };
    } else {
      const data = { ...(change.action === "DISABLE" ? { active: false } : change.action === "ENABLE" ? { active: true } : {}), ...(change.action !== "DISMISS_REQUEST" ? { sessionVersion: { increment: 1 } } : {}) };
      if (change.kind === "CUSTOMER") {
        const updated = await tx.customerAccount.update({ where: { id: account.id }, data: { ...data, ...(change.action === "PROMOTE" ? { role: "ADMIN" } : change.action === "DEMOTE" ? { role: "CUSTOMER" } : {}), ...(change.action === "DISMISS_REQUEST" ? { deletionRequestedAt: null } : {}) } });
        next = { role: updated.role, active: updated.active, sessionVersion: updated.sessionVersion };
      } else {
        const updated = await tx.adminUser.update({ where: { id: account.id }, data });
        next = { role: "ADMIN", active: updated.active, sessionVersion: updated.sessionVersion };
      }
    }
    await tx.accountAudit.create({ data: { actorId: actor.id, targetId: account.id, targetKind: change.kind, action: change.action, previous, next } });
  }, { maxWait: 10000, timeout: 30000 });
}
