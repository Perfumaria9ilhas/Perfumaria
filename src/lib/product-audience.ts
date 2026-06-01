export const productAudienceOptions = [
  { value: "FEMININO", label: "Feminino" },
  { value: "MASCULINO", label: "Masculino" },
  { value: "UNISSEXO", label: "Unissexo" },
] as const;

export type ProductAudienceValue = (typeof productAudienceOptions)[number]["value"];

export function getProductAudienceLabel(audience: string) {
  return (
    productAudienceOptions.find((option) => option.value === audience)?.label ?? "Unissexo"
  );
}
