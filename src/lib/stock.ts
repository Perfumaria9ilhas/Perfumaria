import { StockMovementReason, StockMovementType } from "@prisma/client";

export type StockStatus = "OUT" | "LOW" | "STABLE";
export type StockSortDirection = "asc" | "desc";

export type StockSortKey =
  | "product"
  | "brand"
  | "category"
  | "salePrice"
  | "unitCost"
  | "stock"
  | "alertLimit"
  | "entries"
  | "outputs"
  | "investedValue"
  | "potentialSalesValue"
  | "potentialProfit"
  | "status"
  | "lastUpdated";

export type StockFilters = {
  query: string;
  brandId: string;
  categoryId: string;
  customerName: string;
  status: "all" | StockStatus;
  missingCostOnly: boolean;
  zeroStockOnly: boolean;
};

export type StockPagination = {
  page: number;
  pageSize: 25 | 50 | 100;
};

export type AdminStockRow = {
  id: string;
  catalogReference: string;
  brandSlotLabel: string;
  name: string;
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryName: string;
  supplierName: string | null;
  imageUrl: string;
  salePriceInCents: number;
  unitCostInCents: number;
  stock: number;
  lowStockAlert: number;
  entries: number;
  outputs: number;
  investedValueInCents: number;
  potentialSalesValueInCents: number;
  potentialProfitInCents: number | null;
  status: StockStatus;
  stockNotes: string | null;
  customerNames: string[];
  lastUpdatedAt: string;
  updatedAt: string;
};

export type AdminStockMovementRow = {
  id: string;
  productId: string;
  productName: string;
  brandName: string;
  type: StockMovementType;
  reason: StockMovementReason | null;
  customerName: string | null;
  saleUnitPriceInCents: number | null;
  quantity: number;
  previousStock: number;
  resultingStock: number;
  unitCostInCents: number | null;
  supplier: string | null;
  notes: string | null;
  createdAt: string;
};

export type StockCustomerSummary = {
  customerName: string;
  totalOrders: number;
  totalUnits: number;
  totalSpentInCents: number;
  lastSaleAt: string;
};

export function getBrandCatalogCapacity(brandName: string) {
  return brandName.trim().toLowerCase() === "lattafa" ? 100 : 50;
}

export type StockSummary = {
  totalProducts: number;
  totalUnits: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalInvestedInCents: number;
  totalPotentialSalesInCents: number;
  totalPotentialProfitInCents: number;
};

export type StockImportPreviewRow = {
  rowNumber: number;
  productId: string;
  productName: string;
  brandName: string;
  categoryName: string;
  currentStock: number;
  nextStock: number;
  currentUnitCostInCents: number;
  nextUnitCostInCents: number;
  currentAlertLimit: number;
  nextAlertLimit: number;
  currentNotes: string | null;
  nextNotes: string | null;
  changes: string[];
  errors: string[];
};

const collator = new Intl.Collator("pt-PT", { sensitivity: "base", numeric: true });

export function getStockStatus(stock: number, lowStockAlert: number): StockStatus {
  if (stock === 0) {
    return "OUT";
  }

  if (stock <= lowStockAlert) {
    return "LOW";
  }

  return "STABLE";
}

export function getStockStatusLabel(status: StockStatus) {
  switch (status) {
    case "OUT":
      return "Esgotado";
    case "LOW":
      return "Stock baixo";
    case "STABLE":
      return "Stock estavel";
  }
}

export function getStockStatusTone(status: StockStatus) {
  switch (status) {
    case "OUT":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "LOW":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "STABLE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

export function hasMissingCost(row: Pick<AdminStockRow, "unitCostInCents">) {
  return row.unitCostInCents <= 0;
}

export function hasZeroStock(row: Pick<AdminStockRow, "stock">) {
  return row.stock === 0;
}

export function buildStockSummary(rows: AdminStockRow[]): StockSummary {
  return rows.reduce<StockSummary>(
    (summary, row) => {
      summary.totalProducts += 1;
      summary.totalUnits += row.stock;
      if (row.status === "LOW") {
        summary.lowStockProducts += 1;
      }
      if (row.status === "OUT") {
        summary.outOfStockProducts += 1;
      }
      summary.totalInvestedInCents += row.investedValueInCents;
      summary.totalPotentialSalesInCents += row.potentialSalesValueInCents;
      if (row.potentialProfitInCents !== null) {
        summary.totalPotentialProfitInCents += row.potentialProfitInCents;
      }
      return summary;
    },
    {
      totalProducts: 0,
      totalUnits: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      totalInvestedInCents: 0,
      totalPotentialSalesInCents: 0,
      totalPotentialProfitInCents: 0,
    },
  );
}

export function filterStockRows(rows: AdminStockRow[], filters: StockFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return rows.filter((row) => {
    if (normalizedQuery) {
      const haystack = `${row.name} ${row.brandName}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    if (filters.brandId && row.brandId !== filters.brandId) {
      return false;
    }

    if (filters.categoryId && row.categoryId !== filters.categoryId) {
      return false;
    }

    if (
      filters.customerName &&
      !row.customerNames.some((customerName) => customerName === filters.customerName)
    ) {
      return false;
    }

    if (filters.status !== "all" && row.status !== filters.status) {
      return false;
    }

    if (filters.missingCostOnly && !hasMissingCost(row)) {
      return false;
    }

    if (filters.zeroStockOnly && !hasZeroStock(row)) {
      return false;
    }

    return true;
  });
}

export function sortStockRows(
  rows: AdminStockRow[],
  sortKey: StockSortKey,
  sortDirection: StockSortDirection,
) {
  const direction = sortDirection === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    const result = compareStockRows(left, right, sortKey);
    if (result !== 0) {
      return result * direction;
    }

    return collator.compare(left.name, right.name);
  });
}

function compareNullableNumber(left: number | null, right: number | null) {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left - right;
}

function compareStockRows(left: AdminStockRow, right: AdminStockRow, sortKey: StockSortKey) {
  switch (sortKey) {
    case "product":
      return collator.compare(left.name, right.name);
    case "brand":
      return collator.compare(left.brandName, right.brandName);
    case "category":
      return collator.compare(left.categoryName, right.categoryName);
    case "salePrice":
      return left.salePriceInCents - right.salePriceInCents;
    case "unitCost":
      return left.unitCostInCents - right.unitCostInCents;
    case "stock":
      return left.stock - right.stock;
    case "alertLimit":
      return left.lowStockAlert - right.lowStockAlert;
    case "entries":
      return left.entries - right.entries;
    case "outputs":
      return left.outputs - right.outputs;
    case "investedValue":
      return left.investedValueInCents - right.investedValueInCents;
    case "potentialSalesValue":
      return left.potentialSalesValueInCents - right.potentialSalesValueInCents;
    case "potentialProfit":
      return compareNullableNumber(left.potentialProfitInCents, right.potentialProfitInCents);
    case "status":
      return getStatusWeight(left.status) - getStatusWeight(right.status);
    case "lastUpdated":
      return new Date(left.lastUpdatedAt).getTime() - new Date(right.lastUpdatedAt).getTime();
  }
}

function getStatusWeight(status: StockStatus) {
  switch (status) {
    case "OUT":
      return 0;
    case "LOW":
      return 1;
    case "STABLE":
      return 2;
  }
}

export function paginateStockRows(rows: AdminStockRow[], pagination: StockPagination) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pagination.pageSize));
  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
  const start = (currentPage - 1) * pagination.pageSize;

  return {
    totalPages,
    currentPage,
    pageRows: rows.slice(start, start + pagination.pageSize),
  };
}

export function getMovementTypeLabel(type: StockMovementType) {
  switch (type) {
    case "ENTRY":
      return "Entrada";
    case "SALE":
      return "Saida";
    case "ADJUSTMENT":
      return "Ajuste manual";
  }
}

export function getMovementReasonLabel(reason: StockMovementReason | null) {
  switch (reason) {
    case "SALE":
      return "Venda";
    case "GIFT":
      return "Oferta";
    case "LOSS":
      return "Quebra/perda";
    case "DECANT":
      return "Decant";
    case "INTERNAL_USE":
      return "Uso interno";
    case "OTHER":
      return "Outro";
    case "MANUAL":
      return "Manual";
    default:
      return "—";
  }
}

export function toEuroInput(valueInCents: number) {
  if (valueInCents <= 0) {
    return "";
  }

  return (valueInCents / 100).toFixed(2).replace(".", ",");
}

export function parsePageSize(value: string | null): 25 | 50 | 100 {
  if (value === "50" || value === "100") {
    return Number(value) as 50 | 100;
  }

  return 25;
}

export function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function parseBooleanFlag(value: string | null) {
  return value === "1" || value === "true";
}

export function parseStockFilters(searchParams: URLSearchParams): StockFilters {
  const statusValue = searchParams.get("status");
  const status =
    statusValue === "OUT" || statusValue === "LOW" || statusValue === "STABLE"
      ? statusValue
      : "all";

  return {
    query: searchParams.get("query") ?? "",
    brandId: searchParams.get("brandId") ?? "",
    categoryId: searchParams.get("categoryId") ?? "",
    customerName: searchParams.get("customerName") ?? "",
    status,
    missingCostOnly: parseBooleanFlag(searchParams.get("missingCostOnly")),
    zeroStockOnly: parseBooleanFlag(searchParams.get("zeroStockOnly")),
  };
}
