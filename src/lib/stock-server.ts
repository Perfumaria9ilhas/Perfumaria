import type { Prisma } from "@prisma/client";
import { StockMovementReason, StockMovementType } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import {
  type AdminStockMovementRow,
  type AdminStockRow,
  type StockFilters,
  type StockCustomerSummary,
  type StockImportPreviewRow,
  buildStockSummary,
  filterStockRows,
  getBrandCatalogCapacity,
  getStockStatus,
} from "@/lib/stock";

type XlsxCell = XLSX.CellObject & {
  s?: Record<string, unknown>;
};

function mapProductRow(
  product: Prisma.ProductGetPayload<{
    include: {
      brand: true;
      category: true;
      stockMovements: {
        orderBy: { createdAt: "desc" };
        take: 25;
      };
    };
  }>,
  movementSummary: Map<string, { entries: number; outputs: number }>,
  supplierByProductId: Map<string, string>,
): AdminStockRow {
  const currentSellPriceInCents = product.salePriceInCents ?? product.priceInCents;
  const investedValueInCents = product.stock * product.purchaseCostInCents;
  const potentialSalesValueInCents = product.stock * currentSellPriceInCents;
  const potentialProfitInCents =
    product.purchaseCostInCents > 0
      ? product.stock * (currentSellPriceInCents - product.purchaseCostInCents)
      : null;
  const status = getStockStatus(product.stock, product.lowStockAlert);
  const totals = movementSummary.get(product.id) ?? { entries: 0, outputs: 0 };
  const latestMovementDate = product.stockMovements[0]?.createdAt ?? product.updatedAt;
  const customerNames = Array.from(
    new Set(
      product.stockMovements
        .map((movement) => movement.customerName?.trim())
        .filter((customerName): customerName is string => Boolean(customerName)),
    ),
  ).sort((left, right) => left.localeCompare(right, "pt-PT"));

  return {
    id: product.id,
    catalogReference: "",
    brandSlotLabel: "",
    name: product.name,
    brandId: product.brandId,
    brandName: product.brand.name,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    supplierName: supplierByProductId.get(product.id) ?? null,
    imageUrl: product.imageUrl,
    salePriceInCents: currentSellPriceInCents,
    unitCostInCents: product.purchaseCostInCents,
    stock: product.stock,
    lowStockAlert: product.lowStockAlert,
    entries: totals.entries,
    outputs: totals.outputs,
    investedValueInCents,
    potentialSalesValueInCents,
    potentialProfitInCents,
    status,
    stockNotes: product.stockNotes,
    customerNames,
    lastUpdatedAt: latestMovementDate.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function getAdminStockTableData() {
  noStore();

  const [products, movementGroups, brands, categories, saleMovements, supplierMovements] =
    await Promise.all([
    prisma.product.findMany({
      include: {
        brand: true,
        category: true,
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 25,
        },
      },
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.stockMovement.groupBy({
      by: ["productId", "type"],
      _sum: {
        quantity: true,
      },
    }),
    prisma.brand.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.stockMovement.findMany({
      where: {
        type: StockMovementType.SALE,
        customerName: {
          not: null,
        },
      },
      include: {
        product: {
          select: {
            priceInCents: true,
            salePriceInCents: true,
          },
        },
      },
      orderBy: [{ customerName: "asc" }, { createdAt: "desc" }],
    }),
    prisma.stockMovement.findMany({
      where: {
        supplier: {
          not: null,
        },
      },
      select: {
        productId: true,
        supplier: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
  ]);

  const movementSummary = new Map<string, { entries: number; outputs: number }>();

  for (const group of movementGroups) {
    const current = movementSummary.get(group.productId) ?? { entries: 0, outputs: 0 };
    if (group.type === StockMovementType.ENTRY) {
      current.entries = group._sum.quantity ?? 0;
    }
    if (group.type === StockMovementType.SALE) {
      current.outputs = group._sum.quantity ?? 0;
    }
    movementSummary.set(group.productId, current);
  }

  const supplierByProductId = new Map<string, string>();
  for (const movement of supplierMovements) {
    const supplier = movement.supplier?.trim();
    if (!supplier || supplierByProductId.has(movement.productId)) {
      continue;
    }
    supplierByProductId.set(movement.productId, supplier);
  }

  const rows = products.map((product) => mapProductRow(product, movementSummary, supplierByProductId));
  const groupedRows = new Map<string, AdminStockRow[]>();
  for (const row of rows) {
    const brandRows = groupedRows.get(row.brandName) ?? [];
    brandRows.push(row);
    groupedRows.set(row.brandName, brandRows);
  }

  const orderedBrandNames = [...groupedRows.keys()].sort((left, right) =>
    left.localeCompare(right, "pt-PT"),
  );
  let brandOffset = 1;
  for (const brandName of orderedBrandNames) {
    const brandRows = (groupedRows.get(brandName) ?? []).sort((left, right) =>
      left.name.localeCompare(right.name, "pt-PT"),
    );
    const capacity = Math.max(getBrandCatalogCapacity(brandName), brandRows.length);
    brandRows.forEach((row, index) => {
      row.catalogReference = String(brandOffset + index).padStart(3, "0");
      row.brandSlotLabel = `${index + 1}/${capacity}`;
    });
    brandOffset += capacity;
  }
  const customerSummaryMap = new Map<string, StockCustomerSummary>();

  for (const movement of saleMovements) {
    const customerName = movement.customerName?.trim();
    if (!customerName) {
      continue;
    }

    const effectiveUnitPriceInCents =
      movement.saleUnitPriceInCents ??
      movement.product.salePriceInCents ??
      movement.product.priceInCents;

    const current = customerSummaryMap.get(customerName) ?? {
      customerName,
      totalOrders: 0,
      totalUnits: 0,
      totalSpentInCents: 0,
      lastSaleAt: movement.createdAt.toISOString(),
    };

    current.totalOrders += 1;
    current.totalUnits += movement.quantity;
    current.totalSpentInCents += movement.quantity * effectiveUnitPriceInCents;
    if (new Date(current.lastSaleAt).getTime() < movement.createdAt.getTime()) {
      current.lastSaleAt = movement.createdAt.toISOString();
    }
    customerSummaryMap.set(customerName, current);
  }

  const customerSummaries = [...customerSummaryMap.values()].sort((left, right) =>
    left.customerName.localeCompare(right.customerName, "pt-PT"),
  );
  const customerNames = customerSummaries.map((entry) => entry.customerName);

  return {
    rows,
    brands,
    categories,
    customerNames,
    customerSummaries,
    summary: buildStockSummary(rows),
  };
}

export async function getStockMovementsForProducts(productIds: string[]) {
  const movements = await prisma.stockMovement.findMany({
    where: {
      productId: {
        in: productIds,
      },
    },
    include: {
      product: {
        select: {
          name: true,
          priceInCents: true,
          salePriceInCents: true,
          brand: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return movements.map<AdminStockMovementRow>((movement) => ({
    id: movement.id,
    productId: movement.productId,
    productName: movement.product.name,
    brandName: movement.product.brand.name,
    type: movement.type,
    reason: movement.reason,
    customerName: movement.customerName,
    saleUnitPriceInCents:
      movement.saleUnitPriceInCents ??
      movement.product.salePriceInCents ??
      movement.product.priceInCents,
    quantity: movement.quantity,
    previousStock: movement.previousStock,
    resultingStock: movement.resultingStock,
    unitCostInCents: movement.unitCostInCents,
    supplier: movement.supplier,
    notes: movement.notes,
    createdAt: movement.createdAt.toISOString(),
  }));
}

export async function getStockMovementsForProduct(productId: string) {
  return getStockMovementsForProducts([productId]);
}

export async function getFilteredStockExportData(filters: StockFilters, includeAll: boolean) {
  const data = await getAdminStockTableData();
  const rows = includeAll ? data.rows : filterStockRows(data.rows, filters);
  const movements = await getStockMovementsForProducts(rows.map((row) => row.id));

  return {
    rows,
    movements,
    summary: buildStockSummary(rows),
  };
}

export function createStockWorkbookBuffer(rows: AdminStockRow[], movements: AdminStockMovementRow[]) {
  const workbook = XLSX.utils.book_new();

  const stockRows = rows.map((row) => ({
    "Referência catálogo": row.catalogReference,
    Produto: row.name,
    Marca: row.brandName,
    Categoria: row.categoryName,
    Fornecedor: row.supplierName ?? "",
    "Preço de venda": row.salePriceInCents / 100,
    "Custo unitário": row.unitCostInCents > 0 ? row.unitCostInCents / 100 : null,
    "Stock atual": row.stock,
    "Limite de alerta": row.lowStockAlert,
    Saídas: row.outputs,
    "Valor investido": row.investedValueInCents / 100,
    "Valor potencial de venda": row.potentialSalesValueInCents / 100,
    "Lucro potencial":
      row.potentialProfitInCents === null ? "Custo por definir" : row.potentialProfitInCents / 100,
    Estado:
      row.status === "OUT" ? "Esgotado" : row.status === "LOW" ? "Stock baixo" : "Stock estável",
    "Última atualização": new Date(row.lastUpdatedAt),
    Notas: row.stockNotes ?? "",
  }));

  const stockSheet = XLSX.utils.json_to_sheet(stockRows, {
    cellDates: true,
  });
  applySheetPresentation(stockSheet, {
    ref: "A1:P1",
    widths: [16, 28, 20, 20, 18, 16, 16, 12, 14, 12, 16, 22, 18, 14, 22, 30],
    dateColumns: ["O"],
    currencyColumns: ["F", "G", "K", "L", "M"],
  });
  XLSX.utils.book_append_sheet(workbook, stockSheet, "Stock atual");

  const movementRows = movements.map((movement) => ({
    "Data e hora": new Date(movement.createdAt),
    Produto: movement.productName,
    Marca: movement.brandName,
    "Tipo de movimento": getMovementTypeExportLabel(movement.type),
    Cliente: movement.customerName ?? "",
    "Preço unitário venda":
      movement.saleUnitPriceInCents !== null && movement.type === StockMovementType.SALE
        ? movement.saleUnitPriceInCents / 100
        : null,
    "Valor da venda":
      movement.saleUnitPriceInCents !== null && movement.type === StockMovementType.SALE
        ? (movement.saleUnitPriceInCents * movement.quantity) / 100
        : null,
    Quantidade: movement.quantity,
    "Stock anterior": movement.previousStock,
    "Stock posterior": movement.resultingStock,
    "Custo unitário":
      movement.unitCostInCents !== null && movement.unitCostInCents > 0
        ? movement.unitCostInCents / 100
        : null,
    Motivo: getMovementReasonExportLabel(movement.reason),
    Fornecedor: movement.supplier ?? "",
    Notas: movement.notes ?? "",
  }));

  const movementSheet = XLSX.utils.json_to_sheet(movementRows, {
    cellDates: true,
  });
  applySheetPresentation(movementSheet, {
    ref: "A1:N1",
    widths: [22, 28, 20, 18, 22, 16, 16, 12, 14, 14, 16, 16, 18, 30],
    dateColumns: ["A"],
    currencyColumns: ["F", "G", "K"],
  });
  XLSX.utils.book_append_sheet(workbook, movementSheet, "Movimentos");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function createStockImportTemplateBuffer() {
  const rows = await prisma.product.findMany({
    include: {
      brand: true,
      category: true,
    },
    orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
  });

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      "ID interno": row.id,
      Produto: row.name,
      Marca: row.brand.name,
      Categoria: row.category.name,
      "Stock atual": row.stock,
      "Limite de alerta": row.lowStockAlert,
      "Custo unitário": row.purchaseCostInCents > 0 ? row.purchaseCostInCents / 100 : null,
      Notas: row.stockNotes ?? "",
    })),
    {
      cellDates: true,
    },
  );

  applySheetPresentation(sheet, {
    ref: "A1:H1",
    widths: [22, 28, 20, 20, 12, 14, 16, 30],
    currencyColumns: ["G"],
  });

  XLSX.utils.book_append_sheet(workbook, sheet, "Modelo importação");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

type SheetPresentationOptions = {
  ref: string;
  widths: number[];
  currencyColumns?: string[];
  dateColumns?: string[];
};

function applySheetPresentation(sheet: XLSX.WorkSheet, options: SheetPresentationOptions) {
  sheet["!cols"] = options.widths.map((width) => ({ wch: width }));
  sheet["!autofilter"] = { ref: options.ref };
  sheet["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };

  const range = XLSX.utils.decode_range(sheet["!ref"] ?? options.ref);
  for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
    const headerAddress = XLSX.utils.encode_cell({ c: columnIndex, r: 0 });
    const headerCell = sheet[headerAddress] as XlsxCell | undefined;
    if (!headerCell) {
      continue;
    }
    headerCell.s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1A5D67" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  for (const column of options.currencyColumns ?? []) {
    applyNumberFormat(sheet, column, "#,##0.00 [$EUR]");
  }

  for (const column of options.dateColumns ?? []) {
    applyNumberFormat(sheet, column, "dd/mm/yyyy hh:mm");
  }
}

function applyNumberFormat(sheet: XLSX.WorkSheet, column: string, format: string) {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? `${column}1:${column}1`);
  const columnIndex = XLSX.utils.decode_col(column);

  for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex += 1) {
    const cellAddress = XLSX.utils.encode_cell({ c: columnIndex, r: rowIndex });
    const cell = sheet[cellAddress] as XlsxCell | undefined;
    if (!cell) {
      continue;
    }
    cell.z = format;
  }
}

export type ParsedStockImport = {
  previewRows: StockImportPreviewRow[];
  hasErrors: boolean;
};

export async function parseStockImportWorkbook(file: File): Promise<ParsedStockImport> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
  });
  const sheetName = workbook.SheetNames[0];
  const worksheet = sheetName ? workbook.Sheets[sheetName] : null;

  if (!worksheet) {
    return {
      previewRows: [],
      hasErrors: true,
    };
  }

  const rowsMatrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(worksheet, {
    header: 1,
    blankrows: false,
    raw: false,
  });

  const headers = rowsMatrix[0] ?? [];
  const headerMap = new Map<string, number>();
  headers.forEach((value, index) => {
    if (typeof value === "string") {
      headerMap.set(normalizeHeader(value), index);
    }
  });

  const idColumn = findHeaderIndex(headerMap, ["id interno", "id", "product id", "produto id"]);
  const stockColumn = findHeaderIndex(headerMap, ["stock atual", "stock"]);
  const alertColumn = findHeaderIndex(headerMap, ["limite de alerta", "alerta"]);
  const costColumn = findHeaderIndex(headerMap, ["custo unitario", "custo"]);
  const notesColumn = findHeaderIndex(headerMap, ["notas", "stock notes"]);

  if (idColumn === null || stockColumn === null || alertColumn === null || costColumn === null) {
    return {
      previewRows: [
        {
          rowNumber: 1,
          productId: "",
          productName: "",
          brandName: "",
          categoryName: "",
          currentStock: 0,
          nextStock: 0,
          currentUnitCostInCents: 0,
          nextUnitCostInCents: 0,
          currentAlertLimit: 0,
          nextAlertLimit: 0,
          currentNotes: null,
          nextNotes: null,
          changes: [],
          errors: [
            "O ficheiro precisa das colunas ID interno, Stock atual, Limite de alerta e Custo unitário.",
          ],
        },
      ],
      hasErrors: true,
    };
  }

  const importRows: Array<{
    rowNumber: number;
    productId: string;
    nextStock: number;
    nextAlertLimit: number;
    nextUnitCostInCents: number;
    nextNotes: string | null;
    errors: string[];
  }> = [];

  const seenProductIds = new Set<string>();

  for (let rowIndex = 1; rowIndex < rowsMatrix.length; rowIndex += 1) {
    const row = rowsMatrix[rowIndex] ?? [];
    const rawProductId = readMatrixString(row[idColumn]);
    const rawStock = row[stockColumn];
    const rawAlertLimit = row[alertColumn];
    const rawCost = row[costColumn];
    const nextNotes = notesColumn !== null ? readMatrixString(row[notesColumn]) || null : null;

    if (!rawProductId && isBlankImportRow([rawStock, rawAlertLimit, rawCost, nextNotes])) {
      continue;
    }

    const errors: string[] = [];
    if (!rawProductId) {
      errors.push("ID interno em falta.");
    }

    if (rawProductId && seenProductIds.has(rawProductId)) {
      errors.push("ID interno duplicado no ficheiro.");
    }

    if (rawProductId) {
      seenProductIds.add(rawProductId);
    }

    importRows.push({
      rowNumber: rowIndex + 1,
      productId: rawProductId,
      nextStock: parseImportInt(rawStock, "Stock atual", errors),
      nextAlertLimit: parseImportInt(rawAlertLimit, "Limite de alerta", errors),
      nextUnitCostInCents: parseImportMoneyToCents(rawCost, "Custo unitário", errors),
      nextNotes,
      errors,
    });
  }

  const existingProducts = await prisma.product.findMany({
    where: {
      id: {
        in: importRows.map((row) => row.productId).filter(Boolean),
      },
    },
    include: {
      brand: true,
      category: true,
    },
  });

  const productMap = new Map(existingProducts.map((product) => [product.id, product]));

  const previewRows = importRows.map((row) => {
    const product = productMap.get(row.productId);
    const errors = [...row.errors];

    if (!product) {
      errors.push("Produto não encontrado para este ID interno.");
    }

    const changes: string[] = [];
    if (product) {
      if (product.stock !== row.nextStock) {
        changes.push(`Stock ${product.stock} -> ${row.nextStock}`);
      }
      if (product.lowStockAlert !== row.nextAlertLimit) {
        changes.push(`Alerta ${product.lowStockAlert} -> ${row.nextAlertLimit}`);
      }
      if (product.purchaseCostInCents !== row.nextUnitCostInCents) {
        changes.push(`Custo ${(product.purchaseCostInCents / 100).toFixed(2)} -> ${(row.nextUnitCostInCents / 100).toFixed(2)}`);
      }
      if ((product.stockNotes ?? null) !== row.nextNotes) {
        changes.push("Notas atualizadas");
      }
    }

    return {
      rowNumber: row.rowNumber,
      productId: row.productId,
      productName: product?.name ?? "Produto desconhecido",
      brandName: product?.brand.name ?? "—",
      categoryName: product?.category.name ?? "—",
      currentStock: product?.stock ?? 0,
      nextStock: row.nextStock,
      currentUnitCostInCents: product?.purchaseCostInCents ?? 0,
      nextUnitCostInCents: row.nextUnitCostInCents,
      currentAlertLimit: product?.lowStockAlert ?? 0,
      nextAlertLimit: row.nextAlertLimit,
      currentNotes: product?.stockNotes ?? null,
      nextNotes: row.nextNotes,
      changes,
      errors,
    };
  });

  return {
    previewRows,
    hasErrors: previewRows.some((row) => row.errors.length > 0),
  };
}

export async function applyStockImportWorkbook(file: File) {
  const parsed = await parseStockImportWorkbook(file);

  if (parsed.hasErrors) {
    return parsed;
  }

  await prisma.$transaction(async (tx) => {
    for (const row of parsed.previewRows) {
      const current = await tx.product.findUnique({
        where: { id: row.productId },
        select: {
          stock: true,
        },
      });

      if (!current) {
        throw new Error(`Produto não encontrado para o ID ${row.productId}`);
      }

      await tx.product.update({
        where: { id: row.productId },
        data: {
          stock: row.nextStock,
          purchaseCostInCents: row.nextUnitCostInCents,
          lowStockAlert: row.nextAlertLimit,
          stockNotes: row.nextNotes,
        },
      });

      if (current.stock !== row.nextStock) {
        await tx.stockMovement.create({
          data: {
            productId: row.productId,
            type: StockMovementType.ADJUSTMENT,
            reason: StockMovementReason.MANUAL,
            quantity: Math.abs(row.nextStock - current.stock),
            previousStock: current.stock,
            resultingStock: row.nextStock,
            unitCostInCents: row.nextUnitCostInCents > 0 ? row.nextUnitCostInCents : null,
            notes: "Importação Excel",
          },
        });
      }
    }
  });

  return parsed;
}

function getMovementTypeExportLabel(type: StockMovementType) {
  switch (type) {
    case StockMovementType.ENTRY:
      return "Entrada";
    case StockMovementType.SALE:
      return "Saída";
    case StockMovementType.ADJUSTMENT:
      return "Ajuste manual";
  }
}

function getMovementReasonExportLabel(reason: StockMovementReason | null) {
  switch (reason) {
    case StockMovementReason.SALE:
      return "Venda";
    case StockMovementReason.GIFT:
      return "Oferta";
    case StockMovementReason.LOSS:
      return "Quebra/perda";
    case StockMovementReason.DECANT:
      return "Decant";
    case StockMovementReason.INTERNAL_USE:
      return "Uso interno";
    case StockMovementReason.OTHER:
      return "Outro";
    case StockMovementReason.MANUAL:
      return "Manual";
    default:
      return "—";
  }
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function findHeaderIndex(headerMap: Map<string, number>, aliases: string[]) {
  for (const alias of aliases) {
    const normalized = normalizeHeader(alias);
    const index = headerMap.get(normalized);
    if (typeof index === "number") {
      return index;
    }
  }

  return null;
}

function readMatrixString(value: string | number | Date | null | undefined) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value).trim();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}

function parseImportInt(
  value: string | number | Date | null | undefined,
  label: string,
  errors: string[],
) {
  const normalized = parseNumberValue(value);

  if (normalized === null || !Number.isInteger(normalized) || normalized < 0) {
    errors.push(`${label} inválido. Use um número inteiro sem valores negativos.`);
    return 0;
  }

  return normalized;
}

function parseImportMoneyToCents(
  value: string | number | Date | null | undefined,
  label: string,
  errors: string[],
) {
  const normalized = parseNumberValue(value);

  if (normalized === null) {
    return 0;
  }

  if (normalized < 0) {
    errors.push(`${label} inválido. Use um valor numérico sem negativos.`);
    return 0;
  }

  return Math.round(normalized * 100);
}

function parseNumberValue(value: string | number | Date | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace("€", "").replace(/\s+/g, "").replace(",", ".");
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function isBlankImportRow(values: unknown[]) {
  return values.every((value) => value === null || value === undefined || value === "");
}
