export function parseEuroPriceToCentsForStock(value?: string | null, allowEmpty?: false): number;
export function parseEuroPriceToCentsForStock(
  value: string | null | undefined,
  allowEmpty: true,
): number | null;
export function parseEuroPriceToCentsForStock(value?: string | null, allowEmpty = false) {
  const normalized = value?.trim().replace("€", "").replace(/\s+/g, "").replace(",", ".");

  if (!normalized) {
    if (allowEmpty) {
      return null;
    }

    return 0;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Valor monetario invalido.");
  }

  return Math.round(parsed * 100);
}
