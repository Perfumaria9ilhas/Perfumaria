import { applyDailyPerfume, isEligibleDailyPerfume } from "@/lib/daily-perfume";
import { getSalePriceInCents } from "@/lib/format";

export type PromotionRule = { method: "PERCENT" | "FIXED"; value: number; startsAt: Date | string; endsAt: Date | string | null; status: "ENABLED" | "DISABLED" | "ENDED" };
export type PromotionState = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED" | "ENDED";
export function promotionState(rule: PromotionRule, now = new Date()): PromotionState {
  if (rule.status !== "ENABLED") return rule.status;
  if (rule.endsAt && new Date(rule.endsAt) <= now) return "EXPIRED";
  return new Date(rule.startsAt) > now ? "SCHEDULED" : "ACTIVE";
}
export function promotionPrice(base: number, method: PromotionRule["method"], value: number): number | null {
  if (!Number.isSafeInteger(base) || base <= 0 || !Number.isSafeInteger(value) || value <= 0 || (method === "PERCENT" && value >= 10000)) return null;
  const price = method === "FIXED" ? value : Math.round(base * (10000 - value) / 10000);
  return price > 0 && price < base ? price : null;
}
type PricedProduct = { id: string; priceInCents: number; salePriceInCents: number | null; decantBottlePriceInCents?: number; active?: boolean; sizeLabel?: string; category: { slug: string }; productType: { slug: string } };
export function eligiblePromotion(product: PricedProduct) {
  return product.priceInCents > 0 && isEligibleDailyPerfume(product) && !/decant|kit/i.test(product.sizeLabel ?? "");
}
// The base price is never mutated; all candidates are computed independently.
// Decants retain the legacy reference price before either new promotion source.
export function applyProductPromotion<T extends PricedProduct>(product: T, dailyId: string | null, rule?: PromotionRule | null, now = new Date()) {
  const reference = getSalePriceInCents(product);
  const candidate = rule && eligiblePromotion(product) && promotionState(rule, now) === "ACTIVE" ? promotionPrice(product.priceInCents, rule.method, rule.value) : null;
  const normal = { ...product, salePriceInCents: candidate === null ? product.salePriceInCents : Math.min(reference, candidate), decantBottlePriceInCents: reference };
  return applyDailyPerfume(normal, dailyId);
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
