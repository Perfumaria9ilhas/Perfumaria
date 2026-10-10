import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAccountRequestOriginAllowed } from "@/lib/account-request-origin";
const select = { id: true, slug: true, name: true, imageUrl: true, brand: { select: { name: true } } } as const;
async function list(customerId: string) {
  const rows = await prisma.customerFavorite.findMany({ where: { customerId, product: { active: true } }, select: { product: { select } }, orderBy: { createdAt: "desc" } });
  return rows.map(({ product: { brand, ...p } }) => ({ ...p, brandName: brand.name }));
}
const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
  const customer = await getCurrentCustomer();
  return NextResponse.json({ accountId: customer?.id ?? null, items: customer ? await list(customer.id) : [] }, { headers });
}
export async function POST(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Inicie sessão." }, { status: 401, headers });
  if (!isAccountRequestOriginAllowed(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
  const schema = z.object({ ids: z.array(z.string().min(1).max(100)).max(200) }).strict();
  let input; try { input = schema.safeParse(await request.json()); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400, headers }); }
  if (!input.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400, headers });
  const products = await prisma.product.findMany({ where: { id: { in: input.data.ids }, active: true }, select: { id: true } });
  await prisma.customerFavorite.createMany({ data: products.map(p => ({ productId: p.id, customerId: customer.id })), skipDuplicates: true });
  return NextResponse.json({ items: await list(customer.id) }, { headers });
}
export async function PUT(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Inicie sessão." }, { status: 401, headers });
  if (!isAccountRequestOriginAllowed(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
  const schema = z.object({ productId: z.string().min(1).max(100), selected: z.boolean() }).strict();
  let input; try { input = schema.safeParse(await request.json()); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400, headers }); }
  if (!input.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400, headers });
  const { productId, selected } = input.data;
  if (selected) {
    if (!await prisma.product.findFirst({ where: { id: productId, active: true }, select: { id: true } })) return NextResponse.json({ error: "Produto indisponível." }, { status: 400, headers });
    await prisma.customerFavorite.upsert({ where: { customerId_productId: { customerId: customer.id, productId } }, create: { customerId: customer.id, productId }, update: {} });
  } else await prisma.customerFavorite.deleteMany({ where: { customerId: customer.id, productId } });
  return NextResponse.json({ items: await list(customer.id) }, { headers });
}
