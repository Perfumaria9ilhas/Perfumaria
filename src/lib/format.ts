export function formatPrice(priceInCents: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(priceInCents / 100);
}

export function getSalePriceInCents(product: { priceInCents: number; salePriceInCents: number | null }) {
  return product.salePriceInCents && product.salePriceInCents < product.priceInCents
    ? product.salePriceInCents
    : product.priceInCents;
}
