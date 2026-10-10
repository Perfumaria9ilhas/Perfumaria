import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAccountRequestOriginAllowed } from "@/lib/account-request-origin";
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("PROFILE"), firstName: z.string().trim().min(2).max(100), lastName: z.string().trim().min(2).max(100), phone: z.string().trim().min(6).max(40), address: z.string().trim().min(6).max(1000) }).strict(),
  z.object({ action: z.literal("PASSWORD"), currentPassword: z.string().max(72), password: z.string().min(6).max(72), confirmation: z.string().min(6).max(72) }).strict(),
]);
export async function PATCH(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Inicie sessão na sua conta." }, { status: 401 });
  if (!isAccountRequestOriginAllowed(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  let input; try { input = schema.safeParse(await request.json()); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  if (!input.success) return NextResponse.json({ error: "Confirme os campos obrigatórios." }, { status: 400 });
  const current = await prisma.customerAccount.findUnique({ where: { id: customer.id } });
  if (!current?.active) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  let data;
  if (input.data.action === "PASSWORD") {
    if (input.data.password !== input.data.confirmation || !current.passwordHash || !await compare(input.data.currentPassword, current.passwordHash)) return NextResponse.json({ error: "Verifique a palavra-passe atual e a confirmação." }, { status: 400 });
    data = { passwordHash: await hash(input.data.password, 10) };
  } else { const { action, ...profile } = input.data; void action; data = profile; }
  const result = await prisma.customerAccount.updateMany({ where: { id: customer.id, active: true, updatedAt: current.updatedAt, sessionVersion: current.sessionVersion }, data });
  if (!result.count) return NextResponse.json({ error: "A conta foi alterada. Atualize a página e tente novamente." }, { status: 409 });
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
}
