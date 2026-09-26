export const FIVE_ML_PRICE_IN_CENTS = 350;
export const TEN_ML_PRICE_IN_CENTS = 650;

export type ProductSizeValue = "100ml" | "10ml" | "5ml";

export function getProductSizeLabel(size: ProductSizeValue) {
  if (size === "10ml") {
    return "10 ml";
  }

  return size === "5ml" ? "5 ml" : "100 ml";
}

export function getProductBottleSizeLabel(product: { name: string; sizeLabel?: string | null }) {
  if (product.sizeLabel?.trim()) return product.sizeLabel.trim();
  const setSize = product.name.match(/\b(\d+)\s*[×x]\s*(\d+)\s*ml\b/i);
  if (setSize) return `${setSize[1]} × ${setSize[2]} ml`;
  const volume = product.name.match(/\b(\d+)\s*(ml|g)\b/i);
  return volume ? `${volume[1]} ${volume[2].toLowerCase()}` : "100 ml";
}

export function buildCartLineId(productId: string, size: ProductSizeValue) {
  return `${productId}:${size}`;
}
