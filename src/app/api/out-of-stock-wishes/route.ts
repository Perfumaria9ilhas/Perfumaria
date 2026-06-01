import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  productId: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await prisma.outOfStockWish.upsert({
    where: { productId: parsed.data.productId },
    update: {
      attempts: {
        increment: 1,
      },
    },
    create: {
      productId: parsed.data.productId,
      attempts: 1,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/desejos");

  return NextResponse.json({ ok: true });
}
