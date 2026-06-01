export function formatPrice(priceInCents: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(priceInCents / 100);
}
