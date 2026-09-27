import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAzoresDateKey } from "@/lib/date";
import { hasServerAnalyticsConsent, isAnalyticsRateLimited } from "@/lib/analytics-server";

export async function POST(request: Request) {
  if (!hasServerAnalyticsConsent(request)) {
    return NextResponse.json({ accepted: false }, { status: 202 });
  }
  if (isAnalyticsRateLimited(request)) {
    return NextResponse.json({ error: "Limite temporário atingido." }, { status: 429 });
  }
  const dateKey = getAzoresDateKey();

  await prisma.analyticsDaily.upsert({
    where: { dateKey },
    update: {
      visits: {
        increment: 1,
      },
    },
    create: {
      dateKey,
      visits: 1,
    },
  });

  return NextResponse.json({ ok: true, dateKey });
}
