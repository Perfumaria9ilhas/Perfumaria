import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentCustomer } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const orderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
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
  const lines = items
    .map(
      (item) =>
        `• ${item.brand} ${item.name} - ${formatPrice(item.priceInCents * item.quantity)}`,
    )
    .join("\n");

  return `Olá!\n\nGostaria de encomendar:\n\n${lines}\n\nTotal: ${formatPrice(
    totalInCents,
  )}\n\nNome: ${customerName ?? ""}\nIlha:\nMétodo de entrega:\n( ) Entrega local Ilha Terceira\n( ) Envio CTT\n\nObrigado.`;
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

  const order = await prisma.siteOrder.create({
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
          productId: item.id,
          productName: item.name,
          brandName: item.brand,
          unitPriceInCents: item.priceInCents,
          quantity: item.quantity,
          lineTotalInCents: item.priceInCents * item.quantity,
        })),
      },
    },
  });

  const whatsappUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    `${whatsappMessage}\n\nReferência do pedido: ${order.reference}`,
  )}`;

  revalidatePath("/");

  return NextResponse.json({
    orderId: order.id,
    reference: order.reference,
    whatsappUrl,
  });
}
