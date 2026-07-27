const knownProductTypeDetails = {
  EDT: {
    icon: "🥉",
    label: "Eau de Toilette (EDT)",
    description: "Concentracao Media",
  },
  EDP: {
    icon: "🥈",
    label: "Eau de Parfum (EDP)",
    description: "Alta Concentracao de Essencia",
  },
  PARFUM: {
    icon: "🥇",
    label: "Parfum / Pure Parfum",
    description: "Concentracao Premium",
  },
  EXTRAIT: {
    icon: "👑",
    label: "Extrait de Parfum",
    description: "Concentracao Maxima",
  },
  ELIXIR: {
    icon: "🔥",
    label: "Elixir",
    description: "Versao Intensa e de Longa Duracao",
  },
  "PASTA CORPORAL": {
    icon: "🧴",
    label: "Pasta Corporal",
    description: "Cuidado corporal perfumado",
  },
  AMBIENTADOR: {
    icon: "🏠",
    label: "Ambientador",
    description: "Perfume para casa e espacos",
  },
  DESODORIZANTE: {
    icon: "🧴",
    label: "Desodorizante",
    description: "Cuidado perfumado para uso diario",
  },
  "GIFT SET": {
    icon: "🎁",
    label: "Gift Set",
    description: "Conjunto pronto a oferecer",
  },
  "OLEO PERFUMADO": {
    icon: "🧪",
    label: "Oleo Perfumado",
    description: "Essencia concentrada sem spray",
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
