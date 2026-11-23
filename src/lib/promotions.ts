import { applyDailyPerfume } from "@/lib/daily-perfume";
import { getSalePriceInCents } from "@/lib/format";
import { getDecantPriceInCents } from "@/lib/product-sizes";

export type PromotionRule = { method: "PERCENT" | "FIXED" | "AMOUNT"; value: number; startsAt: Date | string; endsAt: Date | string | null; status: "ENABLED" | "DISABLED" | "ENDED"; includeVariants?: boolean };
export type PromotionState = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED" | "ENDED";
export function promotionState(rule: PromotionRule, now = new Date()): PromotionState {
  if (rule.status !== "ENABLED") return rule.status;
  if (rule.endsAt && new Date(rule.endsAt) <= now) return "EXPIRED";
  return new Date(rule.startsAt) > now ? "SCHEDULED" : "ACTIVE";
}
export function promotionPrice(base: number, method: PromotionRule["method"], value: number): number | null {
  if (!Number.isSafeInteger(base) || base <= 0 || !Number.isSafeInteger(value) || value <= 0 || (method === "PERCENT" && value >= 10000)) return null;
  const price = method === "FIXED" ? value : method === "AMOUNT" ? base - value : Math.round(base * (10000 - value) / 10000);
  return price > 0 && price < base ? price : null;
}
type PricedProduct = { id: string; priceInCents: number; salePriceInCents: number | null; decantBottlePriceInCents?: number; active?: boolean; sizeLabel?: string; category: { slug: string }; productType: { slug: string } };
export function eligiblePromotion(product: PricedProduct) {
  return product.active !== false && product.priceInCents > 0;
}
// The base price is never mutated; all candidates are computed independently.
// Decants retain the legacy reference price before either new promotion source.
export function applyProductPromotion<T extends PricedProduct>(product: T, dailyId: string | null, rule?: PromotionRule | null, now = new Date(), storeRule?: PromotionRule | null) {
  const reference = getSalePriceInCents(product);
  const candidate = rule && eligiblePromotion(product) && promotionState(rule, now) === "ACTIVE" ? promotionPrice(product.priceInCents, rule.method, rule.value) : null;
  const storePrice = eligiblePromotion(product) && storeRule && promotionState(storeRule, now) === "ACTIVE" ? promotionPrice(product.priceInCents, storeRule.method, storeRule.value) : null;
  const normal = { ...product, salePriceInCents: candidate === null && storePrice === null ? product.salePriceInCents : Math.min(reference, candidate ?? reference, storePrice ?? reference), decantBottlePriceInCents: reference };
  const variantPrice = (base: number) => Math.min(base,
    rule?.includeVariants && eligiblePromotion(product) && promotionState(rule, now) === "ACTIVE" ? promotionPrice(base, rule.method, rule.value) ?? base : base,
    storeRule && eligiblePromotion(product) && promotionState(storeRule, now) === "ACTIVE" ? promotionPrice(base, storeRule.method, storeRule.value) ?? base : base);
  const fiveMlBasePriceInCents = getDecantPriceInCents(reference, "5ml");
  const tenMlBasePriceInCents = getDecantPriceInCents(reference, "10ml");
  return { ...applyDailyPerfume(normal, dailyId), fiveMlBasePriceInCents, tenMlBasePriceInCents,
    fiveMlPriceInCents: variantPrice(fiveMlBasePriceInCents), tenMlPriceInCents: variantPrice(tenMlBasePriceInCents) };
}

export function decantKitPrice(rule?: PromotionRule | null, now = new Date()) {
  return rule && promotionState(rule, now) === "ACTIVE" ? promotionPrice(1650, rule.method, rule.value) ?? 1650 : 1650;
}
export function azoresDateTime(instant: Date | string) {
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: "Atlantic/Azores", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(instant));
  const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
// Reject nonexistent spring clock times. Repeated autumn times use the earlier instant.
export function parseAzoresDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Data e hora inválidas.");
  const nominal = Date.parse(`${value}:00Z`);
  for (const offset of [0, 3600000]) {
    const instant = new Date(nominal + offset);
    if (Number.isFinite(instant.getTime()) && azoresDateTime(instant) === value) return instant;
  }
  throw new Error("Esta hora não existe nos Açores. Escolha outra hora.");
}
