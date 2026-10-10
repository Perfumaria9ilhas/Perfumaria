import { getSalePriceInCents } from "@/lib/format";

export function dailyPerfumePrice(priceInCents: number) {
  // Integer cents: nearest cent, half rounded upwards; never stack promotions.
  return Math.floor((priceInCents * 90 + 50) / 100);
}
export function isEligibleDailyPerfume(product: { active?: boolean; category: { slug: string }; productType: { slug: string } }) {
  return product.active !== false && ["perfumes-arabes", "perfumes"].includes(product.category.slug) && !["gift-set", "body-mist", "all-over-spray", "desodorizante"].includes(product.productType.slug);
}
export function applyDailyPerfume<T extends { id: string; priceInCents: number; salePriceInCents: number | null; decantBottlePriceInCents?: number; active?: boolean; category: { slug: string }; productType: { slug: string } }>(product: T, dailyId: string | null) {
  if (product.id !== dailyId || !isEligibleDailyPerfume(product)) return product;
  const normalPrice = getSalePriceInCents(product);
  const dailyPrice = dailyPerfumePrice(product.priceInCents);
  return { ...product, salePriceInCents: Math.min(normalPrice, dailyPrice), perfumeOfDay: true, dailyDiscountApplied: dailyPrice <= normalPrice, decantBottlePriceInCents: product.decantBottlePriceInCents ?? normalPrice };
}
