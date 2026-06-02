export const FIVE_ML_PRICE_IN_CENTS = 350;

export type ProductSizeValue = "100ml" | "5ml";

export function getProductSizeLabel(size: ProductSizeValue) {
  return size === "5ml" ? "5 ml" : "100 ml";
}

export function buildCartLineId(productId: string, size: ProductSizeValue) {
  return `${productId}:${size}`;
}
