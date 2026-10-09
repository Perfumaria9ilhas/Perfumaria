import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Inicie sessão." }, { status: 401 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT set_config('nineilhas.account_actor', ${customer.id}, true)`;
    const result = await tx.customerAccount.updateMany({ where: { id: customer.id, active: true, deletionRequestedAt: null }, data: { deletionRequestedAt: new Date() } });
    if (result.count) await tx.accountAudit.create({ data: { actorId: customer.id, targetId: customer.id, targetKind: "CUSTOMER", action: "REQUEST_DELETION", next: { requested: true } } });
  }, { maxWait: 10000, timeout: 30000 });
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
}
