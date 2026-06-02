import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAzoresDateKey } from "@/lib/date";

export async function POST() {
  const dateKey = getAzoresDateKey();

  await prisma.dailySiteVisit.upsert({
    where: { dateKey },
    update: {
      visitCount: {
        increment: 1,
      },
    },
    create: {
      dateKey,
      visitCount: 1,
    },
  });

  return NextResponse.json({ ok: true, dateKey });
}
