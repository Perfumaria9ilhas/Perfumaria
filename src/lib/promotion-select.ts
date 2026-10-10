import { applyProductPromotion, type PromotionRule } from "@/lib/promotions";

export const promotionSelect = { select: { method: true, value: true, startsAt: true, endsAt: true, status: true } } as const;
export function resolveCatalogPrice<T extends Parameters<typeof applyProductPromotion>[0] & { promotion?: PromotionRule | null }>(row: T, dailyId: string | null, now = new Date()) {
  const { promotion, ...product } = row;
  return applyProductPromotion(product, dailyId, promotion, now);
}
