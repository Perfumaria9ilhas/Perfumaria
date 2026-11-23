import { applyProductPromotion, type PromotionRule } from "@/lib/promotions";

export const promotionSelect = { select: { method: true, value: true, startsAt: true, endsAt: true, status: true } } as const;
export const productPromotionSelect = {select:{...promotionSelect.select,includeVariants:true}} as const;
export function resolveCatalogPrice<T extends Parameters<typeof applyProductPromotion>[0] & { promotion?: PromotionRule | null }>(row: T, dailyId: string | null, now = new Date(), storeRule?: PromotionRule | null) {
  const { promotion, ...product } = row;
  return applyProductPromotion(product, dailyId, promotion, now, storeRule);
}
