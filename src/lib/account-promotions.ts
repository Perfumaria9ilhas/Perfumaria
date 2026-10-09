import { getSalePriceInCents } from "@/lib/format";
// Receives the active catalogue after the existing Perfume do Dia rules.
export function accountPromotions<T extends { priceInCents: number; salePriceInCents: number | null; active?: boolean }>(products: T[]) {
  return products.filter(product => product.active !== false && getSalePriceInCents(product) > 0 && getSalePriceInCents(product) < product.priceInCents);
}
