import { NextResponse } from "next/server";
import { z } from "zod";
import { hasServerAnalyticsConsent, isAnalyticsRateLimited } from "@/lib/analytics-server";
import { getAzoresDateKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";

const productEventSchema = z.object({
  event: z.enum(["product_view", "product_reservation"]),
  productId: z.string().min(1).max(100),
});
const cartEventSchema = z.object({
  event: z.literal("add_to_cart"),
  productId: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(50),
});
const checkoutEventSchema = z.object({
  event: z.literal("checkout_whatsapp"),
  items: z.array(z.object({
    productId: z.string().min(1).max(100),
    quantity: z.number().int().min(1).max(50),
  })).min(1).max(50),
});
const generalEventSchema = z.object({ event: z.literal("general_whatsapp") });
const eventSchema = z.discriminatedUnion("event", [
  productEventSchema,
  cartEventSchema,
  checkoutEventSchema,
  generalEventSchema,
]);

export async function POST(request: Request) {
  if (!hasServerAnalyticsConsent(request)) {
    return NextResponse.json({ accepted: false }, { status: 202 });
  }
  if (isAnalyticsRateLimited(request)) {
    return NextResponse.json({ error: "Limite temporário atingido." }, { status: 429 });
  }

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  }

  const dateKey = getAzoresDateKey();
  const productQuantities = new Map<string, number>();
  if ("productId" in parsed.data) {
    productQuantities.set(parsed.data.productId, "quantity" in parsed.data ? parsed.data.quantity : 1);
  } else if (parsed.data.event === "checkout_whatsapp") {
    for (const item of parsed.data.items) {
      productQuantities.set(item.productId, (productQuantities.get(item.productId) ?? 0) + item.quantity);
    }
  }

  if (productQuantities.size) {
    const activeCount = await prisma.product.count({
      where: { id: { in: [...productQuantities.keys()] }, active: true },
    });
    if (activeCount !== productQuantities.size) {
      return NextResponse.json({ error: "Produto inválido." }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    const dailyCreate = {
      dateKey,
      productViews: parsed.data.event === "product_view" ? 1 : 0,
      addToCartEvents: parsed.data.event === "add_to_cart" ? 1 : 0,
      addedUnits: parsed.data.event === "add_to_cart" ? parsed.data.quantity : 0,
      checkoutWhatsapp: parsed.data.event === "checkout_whatsapp" ? 1 : 0,
      reservations: parsed.data.event === "product_reservation" ? 1 : 0,
      generalWhatsappContacts: parsed.data.event === "general_whatsapp" ? 1 : 0,
    };
    await tx.analyticsDaily.upsert({
      where: { dateKey },
      create: dailyCreate,
      update: {
        productViews: { increment: dailyCreate.productViews },
        addToCartEvents: { increment: dailyCreate.addToCartEvents },
        addedUnits: { increment: dailyCreate.addedUnits },
        checkoutWhatsapp: { increment: dailyCreate.checkoutWhatsapp },
        reservations: { increment: dailyCreate.reservations },
        generalWhatsappContacts: { increment: dailyCreate.generalWhatsappContacts },
      },
    });

    for (const [productId, quantity] of productQuantities) {
      const create = {
        dateKey,
        productId,
        views: parsed.data.event === "product_view" ? 1 : 0,
        addToCartEvents: parsed.data.event === "add_to_cart" ? 1 : 0,
        addedUnits: parsed.data.event === "add_to_cart" ? quantity : 0,
        checkoutEvents: parsed.data.event === "checkout_whatsapp" ? 1 : 0,
        checkoutUnits: parsed.data.event === "checkout_whatsapp" ? quantity : 0,
        reservationEvents: parsed.data.event === "product_reservation" ? 1 : 0,
      };
      await tx.productAnalyticsDaily.upsert({
        where: { dateKey_productId: { dateKey, productId } },
        create,
        update: {
          views: { increment: create.views },
          addToCartEvents: { increment: create.addToCartEvents },
          addedUnits: { increment: create.addedUnits },
          checkoutEvents: { increment: create.checkoutEvents },
          checkoutUnits: { increment: create.checkoutUnits },
          reservationEvents: { increment: create.reservationEvents },
        },
      });
    }
  });

  return NextResponse.json({ accepted: true });
}
