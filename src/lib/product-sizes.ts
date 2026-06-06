export const FIVE_ML_PRICE_IN_CENTS = 350;
export const TEN_ML_PRICE_IN_CENTS = 650;

export type ProductSizeValue = "100ml" | "10ml" | "5ml";

export function getProductSizeLabel(size: ProductSizeValue) {
  if (size === "10ml") {
    return "10 ml";
  }

  return size === "5ml" ? "5 ml" : "100 ml";
}

export function buildCartLineId(productId: string, size: ProductSizeValue) {
  return `${productId}:${size}`;
}
