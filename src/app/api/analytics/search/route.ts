import { NextResponse } from "next/server";
import { z } from "zod";
import {
  containsLikelyPersonalData,
  hasServerAnalyticsConsent,
  isAnalyticsRateLimited,
  normalizeAnalyticsSearchTerm,
} from "@/lib/analytics-server";
import { getAzoresDateKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  term: z.string().trim().min(2).max(80),
  resultCount: z.number().int().min(0).max(10_000),
});

export async function POST(request: Request) {
  if (!hasServerAnalyticsConsent(request)) {
    return NextResponse.json({ accepted: false }, { status: 202 });
  }
  if (isAnalyticsRateLimited(request)) {
    return NextResponse.json({ error: "Limite temporário atingido." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || containsLikelyPersonalData(parsed.data.term)) {
    return NextResponse.json({ error: "Pesquisa inválida." }, { status: 400 });
  }

  const normalizedTerm = normalizeAnalyticsSearchTerm(parsed.data.term);
  if (normalizedTerm.length < 2 || normalizedTerm.length > 80) {
    return NextResponse.json({ error: "Pesquisa inválida." }, { status: 400 });
  }
  const dateKey = getAzoresDateKey();
  await prisma.searchAnalyticsDaily.upsert({
    where: { dateKey_normalizedTerm: { dateKey, normalizedTerm } },
    create: {
      dateKey,
      normalizedTerm,
      displayTerm: parsed.data.term.trim().replace(/\s+/g, " "),
      searchCount: 1,
      resultCountTotal: parsed.data.resultCount,
      zeroResultCount: parsed.data.resultCount === 0 ? 1 : 0,
    },
    update: {
      searchCount: { increment: 1 },
      resultCountTotal: { increment: parsed.data.resultCount },
      zeroResultCount: { increment: parsed.data.resultCount === 0 ? 1 : 0 },
    },
  });
  return NextResponse.json({ accepted: true });
}
