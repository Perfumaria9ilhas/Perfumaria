import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentCustomer } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getDecantPriceInCents, getProductBottleSizeLabel } from "@/lib/product-sizes";
import { getSalePriceInCents } from "@/lib/format";
import { applyDailyPerfume } from "@/lib/daily-perfume";
import { readHomepageState } from "@/lib/homepage-config";

const orderItemSchema = z.object({
  productId: z.string().min(1),
  variant: z.enum(["bottle", "5ml", "10ml"]),
  quantity: z.number().int().min(1).max(99),
}).strict();
const createOrderSchema = z.object({ items: z.array(orderItemSchema).min(1).max(50) }).strict();

type ValidatedOrderItem = {
  productId: string;
  name: string;
  brand: string;
  sizeLabel: string;
  priceInCents: number;
  quantity: number;
};

export function buildOrderReference(now = new Date(), suffix = randomBytes(4).toString("hex").toUpperCase()) {
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toISOString().slice(11, 19).replace(/:/g, "");
  return `9I-${date}-${time}-${suffix}`;
}

function buildWhatsappMessage(reference: string, items: ValidatedOrderItem[], totalInCents: number, customerName?: string) {
  const productBlocks = items.map((item) =>
    `${item.brand} ${item.name} — ${item.sizeLabel}\n${item.quantity} × ${formatPrice(item.priceInCents)}`,
  ).join("\n\n");
  return `✦ Novo Pedido — Perfumaria 9 Ilhas\nReferência: ${reference}\n\nOlá! Gostaria de fazer a seguinte encomenda:\n\n${productBlocks}\n\n€ Total: ${formatPrice(totalInCents)}\n\nOs meus dados:\n➤ Nome: ${customerName ?? ""}\n➤ Ilha:\n➤ Método de entrega: Entrega em mão / Envio CTT\n\nObrigado! ☺`;
}

export async function POST(request: Request) {
  let json: unknown;
  try { json = await request.json(); } catch { return NextResponse.json({ error: "Pedido inválido." }, { status: 400 }); }
  const parsed = createOrderSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  const productIds = [...new Set(parsed.data.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sizeLabel: true, priceInCents: true, salePriceInCents: true, stock: true, active: true, availableInFiveMl: true, availableInTenMl: true, brand: { select: { name: true } }, category: {select:{slug:true}}, productType: {select:{slug:true}} },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const settings = await prisma.storeSettings.findUnique({ where: { id: "main" }, select: { whatsappNumber: true, homepageConfig: true } });
  const dailyId = readHomepageState(settings?.homepageConfig).perfumeOfDayId;
  const validatedItems: ValidatedOrderItem[] = [];

  for (const item of parsed.data.items) {
    const product = productMap.get(item.productId);
    if (!product?.active || product.stock <= 0) return NextResponse.json({ error: "Um dos produtos não está disponível." }, { status: 400 });
    const bottlePrice = getSalePriceInCents(applyDailyPerfume(product, dailyId));
    const decantPrice = getSalePriceInCents(product);
    if (item.variant === "5ml" && !product.availableInFiveMl) return NextResponse.json({ error: "A opção de 5 ml não está disponível para este produto." }, { status: 400 });
    if (item.variant === "10ml" && !product.availableInTenMl) return NextResponse.json({ error: "A opção de 10 ml não está disponível para este produto." }, { status: 400 });
    validatedItems.push({
      productId: product.id,
      name: product.name,
      brand: product.brand.name,
      sizeLabel: item.variant === "bottle" ? getProductBottleSizeLabel(product) : item.variant === "5ml" ? "5 ml" : "10 ml",
      priceInCents: item.variant === "bottle" ? bottlePrice : getDecantPriceInCents(decantPrice, item.variant),
      quantity: item.quantity,
    });
  }

  const totalInCents = validatedItems.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0);
  if (!settings?.whatsappNumber) return NextResponse.json({ error: "WhatsApp não configurado." }, { status: 400 });
  const loggedCustomer = await getCurrentCustomer();
  const customerAccount = loggedCustomer ? await prisma.customerAccount.findUnique({ where: { id: loggedCustomer.id } }) : null;
  const customerName = customerAccount ? `${customerAccount.firstName} ${customerAccount.lastName}` : undefined;

  const reference = buildOrderReference();
  const whatsappMessage = buildWhatsappMessage(reference, validatedItems, totalInCents, customerName);
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  return NextResponse.json({ reference, whatsappUrl });
}
