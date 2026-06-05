export const productConcentrationOptions = [
  { value: "EDT", label: "Eau de Toilette (EDT)" },
  { value: "EDP", label: "Eau de Parfum (EDP)" },
  { value: "PARFUM", label: "Parfum / Pure Parfum" },
  { value: "EXTRAIT", label: "Extrait de Parfum" },
  { value: "ELIXIR", label: "Elixir" },
] as const;

export type ProductConcentrationValue =
  (typeof productConcentrationOptions)[number]["value"];

const concentrationDetails: Record<
  ProductConcentrationValue,
  {
    icon: string;
    label: string;
    description: string;
  }
> = {
  EDT: {
    icon: "🥉",
    label: "Eau de Toilette (EDT)",
    description: "Concentração Média",
  },
  EDP: {
    icon: "🥈",
    label: "Eau de Parfum (EDP)",
    description: "Alta Concentração de Essência",
  },
  PARFUM: {
    icon: "🥇",
    label: "Parfum / Pure Parfum",
    description: "Concentração Premium",
  },
  EXTRAIT: {
    icon: "👑",
    label: "Extrait de Parfum",
    description: "Concentração Máxima",
  },
  ELIXIR: {
    icon: "🔥",
    label: "Elixir",
    description: "Versão Intensa e de Longa Duração",
  },
};

export function getProductConcentrationLabel(value: string) {
  return (
    productConcentrationOptions.find((option) => option.value === value)?.label ??
    "Eau de Parfum (EDP)"
  );
}

export function getProductConcentrationDetails(value: string) {
  return concentrationDetails[(value as ProductConcentrationValue) ?? "EDP"] ?? concentrationDetails.EDP;
}
