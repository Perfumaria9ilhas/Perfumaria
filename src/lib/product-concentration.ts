const knownProductTypeDetails = {
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
} as const;

type KnownProductTypeKey = keyof typeof knownProductTypeDetails;

type ProductTypePresentation = {
  icon: string;
  label: string;
  description: string;
};

function normalizeProductTypeKey(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}

export function getProductConcentrationLabel(value?: string | null) {
  const normalized = normalizeProductTypeKey(value);

  if (normalized in knownProductTypeDetails) {
    return knownProductTypeDetails[normalized as KnownProductTypeKey].label;
  }

  return value?.trim() || knownProductTypeDetails.EDP.label;
}

export function getProductConcentrationDetails(value?: string | null): ProductTypePresentation {
  const normalized = normalizeProductTypeKey(value);

  if (normalized in knownProductTypeDetails) {
    return knownProductTypeDetails[normalized as KnownProductTypeKey];
  }

  return {
    icon: "•",
    label: value?.trim() || knownProductTypeDetails.EDP.label,
    description: "",
  };
}
