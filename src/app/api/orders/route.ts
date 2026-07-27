import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentCustomer } from "@/lib/auth";
import { getAzoresDateKey } from "@/lib/date";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  brand: z.string(),
  sizeLabel: z.string().min(1),
  priceInCents: z.number().int().min(0),
  quantity: z.number().int().min(1),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
});

function buildWhatsappMessage(
  items: z.infer<typeof orderItemSchema>[],
  totalInCents: number,
  customerName?: string,
) {
  const symbols = {
    order: "✦",
    total: "€",
    field: "➤",
    thanks: "☺",
  };

  const productBlocks = items
    .map(
      (item) =>
        `${item.brand} ${item.name} — ${item.sizeLabel}\n${item.quantity} × ${formatPrice(item.priceInCents)}`,
    )
    .join("\n\n");

  return (
    `${symbols.order} Novo Pedido — Perfumaria 9 Ilhas\n\n` +
    `Olá! Gostaria de fazer a seguinte encomenda:\n\n` +
    `${productBlocks}\n\n` +
    `${symbols.total} Total: ${formatPrice(totalInCents)}\n\n` +
    `Os meus dados:\n` +
    `${symbols.field} Nome: ${customerName ?? ""}\n` +
    `${symbols.field} Ilha:\n` +
    `${symbols.field} Método de entrega: Entrega em mão / Envio CTT\n\n` +
    `Obrigado! ${symbols.thanks}`
  );
}

function buildReference() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  return `NI-${date}-${time}`;
}

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = createOrderSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const totalInCents = parsed.data.items.reduce(
    (sum, item) => sum + item.priceInCents * item.quantity,
    0,
  );

  const settings = await prisma.storeSettings.findUnique({
    where: { id: "main" },
    select: { whatsappNumber: true },
  });

  if (!settings?.whatsappNumber) {
    return NextResponse.json({ error: "WhatsApp não configurado." }, { status: 400 });
  }

  const loggedCustomer = await getCurrentCustomer();
  const customerAccount = loggedCustomer
    ? await prisma.customerAccount.findUnique({
        where: { id: loggedCustomer.id },
      })
    : null;

  const customerName = customerAccount
    ? `${customerAccount.firstName} ${customerAccount.lastName}`
    : undefined;

  const whatsappMessage = buildWhatsappMessage(parsed.data.items, totalInCents, customerName);

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.siteOrder.create({
      data: {
        reference: buildReference(),
        totalInCents,
        whatsappMessage,
        customerAccountId: customerAccount?.id,
        customerName: customerName ?? null,
        customerEmail: customerAccount?.email ?? null,
        customerPhone: customerAccount?.phone ?? null,
        customerAddress: customerAccount?.address ?? null,
        items: {
          create: parsed.data.items.map((item) => ({
            productId: item.productId,
            productName: `${item.name} (${item.sizeLabel})`,
            brandName: item.brand,
            unitPriceInCents: item.priceInCents,
            quantity: item.quantity,
            lineTotalInCents: item.priceInCents * item.quantity,
          })),
        },
      },
    });

    const activeOrdersCount = await tx.siteOrder.count({
      where: {
        status: {
          not: "cancelado",
        },
      },
    });

    await tx.storeMetric.upsert({
      where: { id: "main" },
      update: {
        totalSatisfiedCustomers: {
          increment: 1,
        },
      },
      create: {
        id: "main",
        totalSatisfiedCustomers: activeOrdersCount,
      },
    });

    await tx.dailySiteVisit.upsert({
      where: { dateKey: getAzoresDateKey() },
      update: {},
      create: {
        dateKey: getAzoresDateKey(),
        visitCount: 0,
      },
    });

    return createdOrder;
  });

  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  revalidatePath("/");

  return NextResponse.json({
    orderId: order.id,
    reference: order.reference,
    whatsappUrl,
  });
}
