"use client";

import { type Brand, type Category, StockMovementReason, StockMovementType } from "@prisma/client";
import {
  Download,
  FileSpreadsheet,
  Filter,
  FileText,
  History,
  PackageX,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import {
  type AdminStockMovementRow,
  type AdminStockRow,
  type StockCustomerSummary,
  type StockImportPreviewRow,
  buildStockSummary,
  filterStockRows,
  getMovementReasonLabel,
  getMovementTypeLabel,
  getStockStatus,
  getStockStatusLabel,
  getStockStatusTone,
  paginateStockRows,
  parsePageSize,
  sortStockRows,
  toEuroInput,
  type StockSortDirection,
  type StockSortKey,
} from "@/lib/stock";

type Props = {
  rows: AdminStockRow[];
  brands: Brand[];
  categories: Category[];
  customerNames: string[];
  customerSummaries: StockCustomerSummary[];
};

type BannerState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

type MovementModalState =
  | {
      kind: "ENTRY" | "SALE" | "ADJUSTMENT" | "HISTORY" | "NOTES";
      row: AdminStockRow;
    }
  | null;

type DraftRowState = {
  salePrice: string;
  stock: string;
  lowStockAlert: string;
  unitCost: string;
  stockNotes: string;
};

export function StockAdminTable({
  rows: initialRows,
  brands,
  categories,
  customerNames: initialCustomerNames,
  customerSummaries: initialCustomerSummaries,
}: Props) {
  const [rows, setRows] = useState(initialRows);
  const [customerNames, setCustomerNames] = useState(initialCustomerNames);
  const [customerSummaries, setCustomerSummaries] = useState(initialCustomerSummaries);
  const [banner, setBanner] = useState<BannerState>(null);
  const [sortKey, setSortKey] = useState<StockSortKey>("product");
  const [sortDirection, setSortDirection] = useState<StockSortDirection>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "OUT" | "LOW" | "STABLE">("all");
  const [missingCostOnly, setMissingCostOnly] = useState(false);
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);
  const [showUnitCostColumn, setShowUnitCostColumn] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, DraftRowState>>({});
  const [savingRowIds, setSavingRowIds] = useState<string[]>([]);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [movementModal, setMovementModal] = useState<MovementModalState>(null);
  const [historyRows, setHistoryRows] = useState<AdminStockMovementRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreviewRows, setImportPreviewRows] = useState<StockImportPreviewRow[]>([]);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importHasErrors, setImportHasErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const deferredQuery = useDeferredValue(searchTerm);

  const availableBrands = useMemo(
    () =>
      [...brands]
        .sort((left, right) => left.name.localeCompare(right.name, "pt-PT"))
        .filter((brand, index, currentBrands) => currentBrands.findIndex((entry) => entry.id === brand.id) === index),
    [brands],
  );
  const availableCategories = useMemo(
    () =>
      [...categories]
        .sort((left, right) => left.name.localeCompare(right.name, "pt-PT"))
        .filter(
          (category, index, currentCategories) =>
            currentCategories.findIndex((entry) => entry.id === category.id) === index,
        ),
    [categories],
  );
  const activeFilters = useMemo(
    () => ({
      query: deferredQuery,
      brandId: selectedBrand,
      categoryId: selectedCategory,
      customerName: selectedCustomer,
      status: selectedStatus,
      missingCostOnly,
      zeroStockOnly: outOfStockOnly,
    }),
    [
      deferredQuery,
      selectedBrand,
      selectedCategory,
      selectedCustomer,
      selectedStatus,
      missingCostOnly,
      outOfStockOnly,
    ],
  );
  const filteredRows = useMemo(() => filterStockRows(rows, activeFilters), [rows, activeFilters]);
  const sortedRows = useMemo(
    () => sortStockRows(filteredRows, sortKey, sortDirection),
    [filteredRows, sortKey, sortDirection],
  );
  const summary = useMemo(() => buildStockSummary(sortedRows), [sortedRows]);
  const pagination = useMemo(
    () => paginateStockRows(sortedRows, { page, pageSize }),
    [sortedRows, page, pageSize],
  );
  const resultsLabel = useMemo(() => {
    if (sortedRows.length === 0) {
      return "Nenhum resultado encontrado";
    }
    if (sortedRows.length === 1) {
      return "1 resultado";
    }
    return `${sortedRows.length} resultados`;
  }, [sortedRows.length]);
  const selectedCustomerSummary = useMemo(
    () =>
      selectedCustomer
        ? customerSummaries.find((entry) => entry.customerName === selectedCustomer) ?? null
        : null,
    [customerSummaries, selectedCustomer],
  );
  const pendingDraftRows = useMemo(
    () =>
      rows.filter((row) => {
        const draft = drafts[row.id];
        return draft ? rowHasPendingChanges(row, draft) : false;
      }),
    [rows, drafts],
  );
  const pendingDraftCount = pendingDraftRows.length;

  async function saveQuickRow(row: AdminStockRow) {
    const draft = drafts[row.id];
    if (!draft || !rowHasPendingChanges(row, draft)) {
      return;
    }

    const nextStock = parseWholeNumberInput(draft.stock);
    const nextAlert = parseWholeNumberInput(draft.lowStockAlert);

    if (nextStock === null || nextAlert === null) {
      setBanner({
        tone: "error",
        message: "Stock e limite de alerta precisam de numeros validos iguais ou maiores que 0.",
      });
      return;
    }

    try {
      setBanner(null);
      await persistRowDraft(row, draft, nextStock, nextAlert);
      setBanner({
        tone: "success",
        message: `Linha de ${row.name} guardada com sucesso.`,
      });
    } catch (error) {
      setBanner({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel guardar a linha.",
      });
    }
  }

  async function saveAllDrafts() {
    if (!pendingDraftRows.length) {
      return;
    }

    setBanner(null);
    setIsSavingAll(true);
    let successCount = 0;
    const failedRows: string[] = [];

    for (const row of pendingDraftRows) {
      const draft = drafts[row.id];
      if (!draft || !rowHasPendingChanges(row, draft)) {
        continue;
      }

      const nextStock = parseWholeNumberInput(draft.stock);
      const nextAlert = parseWholeNumberInput(draft.lowStockAlert);

      if (nextStock === null || nextAlert === null) {
        failedRows.push(row.name);
        continue;
      }

      try {
        await persistRowDraft(row, draft, nextStock, nextAlert);
        successCount += 1;
      } catch {
        failedRows.push(row.name);
      }
    }

    setIsSavingAll(false);

    if (failedRows.length === 0) {
      setBanner({
        tone: "success",
        message: `${successCount} linha(s) guardadas com sucesso.`,
      });
      return;
    }

    setBanner({
      tone: failedRows.length === pendingDraftRows.length ? "error" : "success",
      message:
        failedRows.length === pendingDraftRows.length
          ? `Nao foi possivel guardar ${failedRows.length} linha(s): ${failedRows.join(", ")}.`
          : `${successCount} linha(s) guardadas. Falharam: ${failedRows.join(", ")}.`,
    });
  }

  function discardAllDrafts() {
    setDrafts({});
    setBanner({
      tone: "success",
      message: "Alteracoes pendentes limpas.",
    });
  }

  async function persistRowDraft(
    row: AdminStockRow,
    draft: DraftRowState,
    nextStock: number,
    nextAlert: number,
  ) {
    setSavingRowIds((current) => (current.includes(row.id) ? current : [...current, row.id]));

    try {
      const response = await fetch(`/api/admin/stock/product/${row.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salePrice: draft.salePrice,
          stock: nextStock,
          lowStockAlert: nextAlert,
          unitCost: draft.unitCost,
          stockNotes: draft.stockNotes,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel guardar a linha.");
      }

      const nextSalePrice = parseEuroInputToCents(draft.salePrice);
      const nextUnitCost = parseEuroInputToCents(draft.unitCost);
      const now = new Date().toISOString();

      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.id === row.id
            ? {
                ...currentRow,
                salePriceInCents: nextSalePrice,
                stock: nextStock,
                lowStockAlert: nextAlert,
                unitCostInCents: nextUnitCost,
                investedValueInCents: nextStock * nextUnitCost,
                potentialSalesValueInCents: nextStock * nextSalePrice,
                potentialProfitInCents:
                  nextUnitCost > 0
                    ? nextStock * (nextSalePrice - nextUnitCost)
                    : null,
                stockNotes: draft.stockNotes.trim() || null,
                status: getStockStatus(nextStock, nextAlert),
                lastUpdatedAt: now,
                updatedAt: now,
              }
            : currentRow,
        ),
      );

      setDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[row.id];
        return nextDrafts;
      });
    } finally {
      setSavingRowIds((current) => current.filter((entry) => entry !== row.id));
    }
  }

  function updateDraft(row: AdminStockRow, field: keyof DraftRowState, value: string) {
    setDrafts((currentDrafts) => {
      const existingDraft = currentDrafts[row.id] ?? {
        salePrice: toEuroInput(row.salePriceInCents),
        stock: String(row.stock),
        lowStockAlert: String(row.lowStockAlert),
        unitCost: toEuroInput(row.unitCostInCents),
        stockNotes: row.stockNotes ?? "",
      };

      const nextDraft = {
        ...existingDraft,
        [field]: value,
      };

      return {
        ...currentDrafts,
        [row.id]: nextDraft,
      };
    });
  }

  function getDraftValue(row: AdminStockRow, field: keyof DraftRowState) {
    const draft = drafts[row.id];
    if (draft) {
      return draft[field];
    }

    if (field === "stock") {
      return String(row.stock);
    }
    if (field === "salePrice") {
      return toEuroInput(row.salePriceInCents);
    }
    if (field === "lowStockAlert") {
      return String(row.lowStockAlert);
    }
    if (field === "unitCost") {
      return toEuroInput(row.unitCostInCents);
    }

    return row.stockNotes ?? "";
  }

  function clearFilters() {
    setPage(1);
    setSearchTerm("");
    setSelectedBrand("");
    setSelectedCategory("");
    setSelectedCustomer("");
    setSelectedStatus("all");
    setMissingCostOnly(false);
    setOutOfStockOnly(false);
    setSortKey("product");
    setSortDirection("asc");
  }

  function toggleSort(nextKey: StockSortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "lastUpdated" ? "desc" : "asc");
  }

  function exportExcel(scope: "filtered" | "all") {
    const params = new URLSearchParams();
    if (scope === "filtered") {
      if (searchTerm.trim()) {
        params.set("query", searchTerm.trim());
      }
      if (selectedBrand) {
        params.set("brandId", selectedBrand);
      }
      if (selectedCategory) {
        params.set("categoryId", selectedCategory);
      }
      if (selectedCustomer) {
        params.set("customerName", selectedCustomer);
      }
      if (selectedStatus !== "all") {
        params.set("status", selectedStatus);
      }
      if (missingCostOnly) {
        params.set("missingCostOnly", "1");
      }
      if (outOfStockOnly) {
        params.set("zeroStockOnly", "1");
      }
    }
    params.set("scope", scope === "all" ? "all" : "filtered");
    window.location.href = `/api/admin/stock/export?${params.toString()}`;
  }

  function exportPdf() {
    const printableRows = sortedRows.map((row) => ({
      product: row.name,
      brand: row.brandName,
      category: row.categoryName,
      supplier: row.supplierName ?? "—",
      salePrice: formatPrice(row.salePriceInCents),
      unitCost: row.unitCostInCents > 0 ? formatPrice(row.unitCostInCents) : "—",
      stock: row.stock,
      status: getStockStatusLabel(row.status),
    }));

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1280,height=900");
    if (!printWindow) {
      setBanner({
        tone: "error",
        message: "Nao foi possivel abrir a janela para exportar PDF.",
      });
      return;
    }

    const today = new Date().toLocaleDateString("pt-PT");
    const tableRows = printableRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.product)}</td>
            <td>${escapeHtml(row.brand)}</td>
            <td>${escapeHtml(row.category)}</td>
            <td>${escapeHtml(row.supplier)}</td>
            <td>${escapeHtml(row.salePrice)}</td>
            <td>${escapeHtml(row.unitCost)}</td>
            <td>${row.stock}</td>
            <td>${escapeHtml(row.status)}</td>
          </tr>
        `,
      )
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html lang="pt">
        <head>
          <meta charset="utf-8" />
          <title>Stock Perfumaria 9 Ilhas</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #1e293b;
              margin: 24px;
            }
            h1 {
              margin: 0 0 8px;
              font-size: 24px;
            }
            p {
              margin: 0 0 20px;
              color: #64748b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #d6c8b3;
              padding: 8px;
              text-align: left;
            }
            th {
              background: #f7f1e8;
            }
            @media print {
              body {
                margin: 12px;
              }
            }
          </style>
        </head>
        <body>
          <h1>Stock Perfumaria 9 Ilhas</h1>
          <p>${escapeHtml(resultsLabel)} • ${today}</p>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Marca</th>
                <th>Categoria</th>
                <th>Fornecedor</th>
                <th>Preco</th>
                <th>Custo</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function previewImport() {
    if (!importFile) {
      setBanner({
        tone: "error",
        message: "Selecione primeiro um ficheiro Excel.",
      });
      return;
    }

    try {
      setBanner(null);
      const formData = new FormData();
      formData.append("file", importFile);
      const response = await fetch("/api/admin/stock/import/preview", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel analisar o ficheiro.");
      }

      setImportPreviewRows(payload.previewRows ?? []);
      setImportHasErrors(Boolean(payload.hasErrors));
      setShowImportPanel(true);
    } catch (error) {
      setBanner({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel analisar o ficheiro.",
      });
    }
  }

  async function commitImport() {
    if (!importFile) {
      return;
    }

    try {
      setBanner(null);
      const formData = new FormData();
      formData.append("file", importFile);
      const response = await fetch("/api/admin/stock/import/commit", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        setImportPreviewRows(payload.previewRows ?? []);
        setImportHasErrors(Boolean(payload.hasErrors));
        throw new Error(payload.error ?? "Nao foi possivel importar o ficheiro.");
      }

      const now = new Date().toISOString();
      setRows((currentRows) =>
        currentRows.map((row) => {
          const imported = (payload.previewRows as StockImportPreviewRow[]).find(
            (previewRow) => previewRow.productId === row.id,
          );

          if (!imported) {
            return row;
          }

          return {
            ...row,
            stock: imported.nextStock,
            lowStockAlert: imported.nextAlertLimit,
            unitCostInCents: imported.nextUnitCostInCents,
            investedValueInCents: imported.nextStock * imported.nextUnitCostInCents,
            potentialSalesValueInCents: imported.nextStock * row.salePriceInCents,
            potentialProfitInCents:
              imported.nextUnitCostInCents > 0
                ? imported.nextStock * (row.salePriceInCents - imported.nextUnitCostInCents)
                : null,
            stockNotes: imported.nextNotes,
            status: getStockStatus(imported.nextStock, imported.nextAlertLimit),
            lastUpdatedAt: now,
            updatedAt: now,
          };
        }),
      );

      setShowImportPanel(false);
      setImportPreviewRows([]);
      setImportHasErrors(false);
      setImportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setBanner({
        tone: "success",
        message: "Importacao concluida com sucesso.",
      });
    } catch (error) {
      setBanner({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel concluir a importacao.",
      });
    }
  }

  async function openHistory(row: AdminStockRow) {
    setMovementModal({
      kind: "HISTORY",
      row,
    });
    setHistoryRows([]);
    setHistoryLoading(true);

    try {
      const response = await fetch(`/api/admin/stock/product/${row.id}/movements`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel carregar o historico.");
      }
      setHistoryRows(payload.movements ?? []);
    } catch (error) {
      setBanner({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel carregar o historico.",
      });
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function submitMovement(event: React.FormEvent<HTMLFormElement>, row: AdminStockRow) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const type = formData.get("type")?.toString() as StockMovementType;

    const payload =
      type === StockMovementType.ADJUSTMENT
        ? {
            type,
            nextStock: Number(formData.get("nextStock")),
            notes: formData.get("notes")?.toString() ?? "",
          }
        : {
            type,
            quantity: Number(formData.get("quantity")),
            unitCost: formData.get("unitCost")?.toString() ?? "",
            supplier: formData.get("supplier")?.toString() ?? "",
            customerName: formData.get("customerName")?.toString() ?? "",
            reason: (formData.get("reason")?.toString() as StockMovementReason | undefined) ?? null,
            notes: formData.get("notes")?.toString() ?? "",
          };

    try {
      const response = await fetch(`/api/admin/stock/product/${row.id}/movements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Nao foi possivel registar o movimento.");
      }

      const nextRow = applyMovementLocally(row, payload);
      setRows((currentRows) =>
        currentRows.map((currentRow) => (currentRow.id === row.id ? nextRow : currentRow)),
      );
      if (payload.type === StockMovementType.SALE) {
        const trimmedCustomerName = payload.customerName.trim();
        if (trimmedCustomerName) {
          const saleTotalInCents = payload.quantity * row.salePriceInCents;
          const now = new Date().toISOString();
          setCustomerNames((currentNames) =>
            currentNames.includes(trimmedCustomerName)
              ? currentNames
              : [...currentNames, trimmedCustomerName].sort((left, right) =>
                  left.localeCompare(right, "pt-PT"),
                ),
          );
          setCustomerSummaries((currentSummaries) => {
            const existing = currentSummaries.find((entry) => entry.customerName === trimmedCustomerName);
            if (!existing) {
              return [
                ...currentSummaries,
                {
                  customerName: trimmedCustomerName,
                  totalOrders: 1,
                  totalUnits: payload.quantity,
                  totalSpentInCents: saleTotalInCents,
                  lastSaleAt: now,
                },
              ].sort((left, right) => left.customerName.localeCompare(right.customerName, "pt-PT"));
            }

            return currentSummaries
              .map((entry) =>
                entry.customerName === trimmedCustomerName
                  ? {
                      ...entry,
                      totalOrders: entry.totalOrders + 1,
                      totalUnits: entry.totalUnits + payload.quantity,
                      totalSpentInCents: entry.totalSpentInCents + saleTotalInCents,
                      lastSaleAt: now,
                    }
                  : entry,
              )
              .sort((left, right) => left.customerName.localeCompare(right.customerName, "pt-PT"));
          });
        }
      }
      setMovementModal(null);
      setBanner({
        tone: "success",
        message: `Movimento registado em ${row.name}.`,
      });
    } catch (error) {
      setBanner({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel registar o movimento.",
      });
    }
  }

  async function deleteHistoryMovement(row: AdminStockRow, movement: AdminStockMovementRow) {
    const confirmed = window.confirm(
      `Apagar este movimento de ${row.name}? O stock sera recalculado automaticamente.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingMovementId(movement.id);
      setBanner(null);

      const response = await fetch(`/api/admin/stock/product/${row.id}/movements`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movementId: movement.id,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel apagar a venda.");
      }

      setHistoryRows((currentRows) =>
        currentRows.filter((currentMovement) => currentMovement.id !== movement.id),
      );

      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.id === row.id
            ? {
                ...currentRow,
                stock: payload.updatedRow.stock,
                entries: payload.updatedRow.entries,
                outputs: payload.updatedRow.outputs,
                customerNames: payload.updatedRow.customerNames,
                supplierName: payload.updatedRow.supplierName,
                investedValueInCents: payload.updatedRow.stock * currentRow.unitCostInCents,
                potentialSalesValueInCents: payload.updatedRow.stock * currentRow.salePriceInCents,
                potentialProfitInCents:
                  currentRow.unitCostInCents > 0
                    ? payload.updatedRow.stock * (currentRow.salePriceInCents - currentRow.unitCostInCents)
                    : null,
                status: getStockStatus(payload.updatedRow.stock, currentRow.lowStockAlert),
                lastUpdatedAt: payload.updatedRow.lastUpdatedAt,
                updatedAt: new Date().toISOString(),
              }
            : currentRow,
        ),
      );
      if (movement.customerName) {
        const saleTotalInCents =
          movement.quantity * (movement.saleUnitPriceInCents ?? row.salePriceInCents);
        setCustomerSummaries((currentSummaries) => {
          const nextSummaries = currentSummaries
            .map((entry) => {
              if (entry.customerName !== movement.customerName) {
                return entry;
              }

              const nextTotalOrders = Math.max(0, entry.totalOrders - 1);
              const nextTotalUnits = Math.max(0, entry.totalUnits - movement.quantity);
              const nextTotalSpentInCents = Math.max(0, entry.totalSpentInCents - saleTotalInCents);

              if (nextTotalOrders === 0 || nextTotalUnits === 0) {
                return null;
              }

              return {
                ...entry,
                totalOrders: nextTotalOrders,
                totalUnits: nextTotalUnits,
                totalSpentInCents: nextTotalSpentInCents,
              };
            })
            .filter((entry): entry is StockCustomerSummary => Boolean(entry))
            .sort((left, right) => left.customerName.localeCompare(right.customerName, "pt-PT"));

          setCustomerNames(nextSummaries.map((entry) => entry.customerName));
          if (
            selectedCustomer === movement.customerName &&
            !nextSummaries.some((entry) => entry.customerName === movement.customerName)
          ) {
            setSelectedCustomer("");
          }
          return nextSummaries;
        });
      }

      setBanner({
        tone: "success",
        message: `Movimento apagado em ${row.name}.`,
      });
    } catch (error) {
      setBanner({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel apagar o movimento.",
      });
    } finally {
      setDeletingMovementId(null);
    }
  }

  async function submitNotes(event: React.FormEvent<HTMLFormElement>, row: AdminStockRow) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      const stockNotes = formData.get("stockNotes")?.toString() ?? "";
      const response = await fetch(`/api/admin/stock/product/${row.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salePrice: toEuroInput(row.salePriceInCents),
          stock: row.stock,
          lowStockAlert: row.lowStockAlert,
          unitCost: toEuroInput(row.unitCostInCents),
          stockNotes,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel guardar as notas.");
      }

      setRows((currentRows) =>
        currentRows.map((currentRow) => {
          if (currentRow.id !== row.id) {
            return currentRow;
          }

          const now = new Date().toISOString();
          return {
            ...currentRow,
            stockNotes: stockNotes.trim() || null,
            updatedAt: now,
            lastUpdatedAt: now,
          };
        }),
      );
      setMovementModal(null);
      setBanner({
        tone: "success",
        message: `Notas internas de ${row.name} atualizadas.`,
      });
    } catch (error) {
      setBanner({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel guardar as notas.",
      });
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[1.8rem] border border-[color:var(--line)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="rounded-[1.4rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => {
                      setPage(1);
                      setSearchTerm(event.target.value);
                    }}
                    placeholder="Pesquisar produto ou marca..."
                    className="h-10 w-full rounded-2xl border border-[color:var(--line)] bg-white pl-11 pr-4 text-sm text-[color:var(--ink)] placeholder:text-slate-400"
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  <CompactSelect value={selectedBrand} onChange={(value) => { setPage(1); setSelectedBrand(value); }}>
                    <option value="">Marca</option>
                    {availableBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </CompactSelect>
                  <CompactSelect value={selectedCategory} onChange={(value) => { setPage(1); setSelectedCategory(value); }}>
                    <option value="">Categoria</option>
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </CompactSelect>
                  <CompactSelect value={selectedCustomer} onChange={(value) => { setPage(1); setSelectedCustomer(value); }}>
                    <option value="">Cliente</option>
                    {customerNames.map((customerName) => (
                      <option key={customerName} value={customerName}>{customerName}</option>
                    ))}
                  </CompactSelect>
                  <CompactSelect value={selectedStatus} onChange={(value) => { setPage(1); setSelectedStatus(value as "all" | "OUT" | "LOW" | "STABLE"); }}>
                    <option value="all">Estado</option>
                    <option value="OUT">Esgotado</option>
                    <option value="LOW">Stock baixo</option>
                    <option value="STABLE">Stock estavel</option>
                  </CompactSelect>
                  <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-white px-3">
                    <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                    <select
                      value={pageSize}
                      onChange={(event) => {
                        setPage(1);
                        setPageSize(parsePageSize(event.target.value));
                      }}
                      className="h-10 w-full bg-transparent text-sm text-[color:var(--ink)] outline-none"
                    >
                      <option value="25">25 linhas</option>
                      <option value="50">50 linhas</option>
                      <option value="100">100 linhas</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
                    <Filter className="h-4 w-4" />
                    {resultsLabel}
                  </span>
                  {selectedCustomerSummary ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[color:var(--ink)]">
                      Cliente {selectedCustomerSummary.customerName}: {formatPrice(selectedCustomerSummary.totalSpentInCents)}
                    </span>
                  ) : null}
                  <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={missingCostOnly}
                      onChange={(event) => {
                        setPage(1);
                        setMissingCostOnly(event.target.checked);
                      }}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Sem custo
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={outOfStockOnly}
                      onChange={(event) => {
                        setPage(1);
                        setOutOfStockOnly(event.target.checked);
                      }}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Sem stock
                  </label>
                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm font-medium text-slate-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {banner ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                banner.tone === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {banner.message}
            </div>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.8rem] border border-[color:var(--line)] bg-white shadow-sm">
        {pendingDraftCount ? (
          <div className="flex flex-col gap-3 border-b border-[color:var(--line)] bg-[color:var(--sand-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[color:var(--ink)]">
              {pendingDraftCount} linha(s) com alteracoes por guardar.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={discardAllDrafts}
                disabled={isSavingAll}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Limpar alteracoes
              </button>
              <button
                type="button"
                onClick={saveAllDrafts}
                disabled={isSavingAll}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[color:var(--atlantic)] px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSavingAll ? "A guardar tudo..." : "Guardar tudo"}
              </button>
            </div>
          </div>
        ) : null}
        <div className="border-b border-[color:var(--line)] bg-[color:var(--sand-soft)] px-4 py-2 text-xs text-slate-500 md:hidden">
          Deslize a tabela para ver mais colunas. O produto fica fixo para ser mais facil acompanhar.
        </div>
        <div className="border-b border-[color:var(--line)] bg-white px-3 py-2 md:hidden">
          <div className="grid grid-cols-[minmax(0,2fr)_4.8rem_4.2rem_3.4rem_2rem_2rem] items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
            <span>Produto</span>
            <span>Preco</span>
            <button
              type="button"
              onClick={() => setShowUnitCostColumn((current) => !current)}
              className={`text-left ${showUnitCostColumn ? "text-[color:var(--ink)]" : "text-slate-500"}`}
            >
              Custo
            </button>
            <span>Stock</span>
            <span className="text-center">S</span>
            <span className="text-center">H</span>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm md:min-w-[1840px]">
            <thead className="hidden md:table-header-group">
              <tr className="bg-[color:var(--sand-soft)] text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <TableHeader title="Produto" active={sortKey === "product"} direction={sortDirection} onClick={() => toggleSort("product")} sticky />
                <TableHeader
                  title="Marca"
                  active={sortKey === "brand"}
                  direction={sortDirection}
                  onClick={() => toggleSort("brand")}
                  className="hidden md:table-cell"
                />
                <TableHeader
                  title="Categoria"
                  active={sortKey === "category"}
                  direction={sortDirection}
                  onClick={() => toggleSort("category")}
                  className="hidden md:table-cell"
                />
                <TableHeader
                  title="Fornecedor"
                  active={sortKey === "product"}
                  direction={sortDirection}
                  onClick={() => toggleSort("product")}
                  className="hidden md:table-cell"
                />
                <TableHeader
                  title="Preco de venda"
                  active={sortKey === "salePrice"}
                  direction={sortDirection}
                  onClick={() => toggleSort("salePrice")}
                  className="hidden md:table-cell"
                />
                <TableHeader
                  title={showUnitCostColumn ? "Custo unitario - ocultar" : "Custo unitario - mostrar"}
                  active={showUnitCostColumn}
                  direction="asc"
                  onClick={() => setShowUnitCostColumn((current) => !current)}
                  className="hidden md:table-cell"
                />
                <TableHeader
                  title="Stock atual"
                  active={sortKey === "stock"}
                  direction={sortDirection}
                  onClick={() => toggleSort("stock")}
                  className="hidden md:table-cell"
                />
                <TableHeader
                  title="Limite alerta"
                  active={sortKey === "alertLimit"}
                  direction={sortDirection}
                  onClick={() => toggleSort("alertLimit")}
                  className="hidden md:table-cell"
                />
                <TableHeader
                  title="Saidas"
                  active={sortKey === "outputs"}
                  direction={sortDirection}
                  onClick={() => toggleSort("outputs")}
                  className="hidden md:table-cell"
                />
                <TableHeader
                  title="Valor investido"
                  active={sortKey === "investedValue"}
                  direction={sortDirection}
                  onClick={() => toggleSort("investedValue")}
                  className="hidden xl:table-cell"
                />
                <TableHeader
                  title="Venda potencial"
                  active={sortKey === "potentialSalesValue"}
                  direction={sortDirection}
                  onClick={() => toggleSort("potentialSalesValue")}
                  className="hidden xl:table-cell"
                />
                <TableHeader
                  title="Lucro potencial"
                  active={sortKey === "potentialProfit"}
                  direction={sortDirection}
                  onClick={() => toggleSort("potentialProfit")}
                  className="hidden xl:table-cell"
                />
                <TableHeader
                  title="Estado"
                  active={sortKey === "status"}
                  direction={sortDirection}
                  onClick={() => toggleSort("status")}
                  className="hidden md:table-cell"
                />
                <TableHeader
                  title="Ultima atualizacao"
                  active={sortKey === "lastUpdated"}
                  direction={sortDirection}
                  onClick={() => toggleSort("lastUpdated")}
                  className="hidden lg:table-cell"
                />
                <th className="hidden top-0 z-20 border-b border-[color:var(--line)] bg-[color:var(--sand-soft)] px-3 py-4 md:sticky md:right-0 md:table-cell md:px-4">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={15}
                    className="border-b border-[color:var(--line)] px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Nenhum resultado encontrado.
                  </td>
                </tr>
              ) : null}
              {pagination.pageRows.map((row) => {
                const draft = drafts[row.id];
                const hasDraft = draft ? rowHasPendingChanges(row, draft) : false;
                const isSavingRow = savingRowIds.includes(row.id);
                return (
                  <tr key={row.id} className="border-b border-[color:var(--line)] align-top">
                    <td className="z-10 border-b border-[color:var(--line)] bg-white px-3 py-3 md:sticky md:left-0 md:px-4 md:py-4">
                      <div className="hidden min-w-[170px] md:block md:min-w-[220px]">
                        <p className="text-[15px] font-semibold leading-tight text-[color:var(--ink)] md:text-base">{row.name}</p>
                        <p className="mt-1 text-[11px] text-slate-500">Ref. {row.catalogReference} · Slot {row.brandSlotLabel}</p>
                      </div>
                      <div className="grid grid-cols-[minmax(0,2fr)_4.8rem_4.2rem_3.4rem_2rem_2rem] items-center gap-2 md:hidden">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold leading-tight text-[color:var(--ink)]">{row.name}</p>
                          <p className="truncate text-[10px] leading-tight text-slate-500">{row.brandName}</p>
                          <p className="truncate text-[10px] leading-tight text-slate-500">{row.categoryName}</p>
                          <p className="truncate text-[10px] leading-tight text-slate-500">Ref. {row.catalogReference}</p>
                        </div>
                        <MobileInlineInput
                          value={getDraftValue(row, "salePrice")}
                          onChange={(value) => updateDraft(row, "salePrice", value)}
                          inputMode="decimal"
                          placeholder="0,00"
                        />
                        <MobileInlineInput
                          value={showUnitCostColumn ? getDraftValue(row, "unitCost") : ""}
                          onChange={(value) => updateDraft(row, "unitCost", value)}
                          inputMode="decimal"
                          placeholder=""
                          disabled={!showUnitCostColumn}
                        />
                        <MobileInlineInput
                          value={getDraftValue(row, "stock")}
                          onChange={(value) => updateDraft(row, "stock", value)}
                          inputMode="numeric"
                          placeholder=""
                        />
                        <MobileIconAction
                          label="Saida"
                          icon={<PackageX className="h-3.5 w-3.5" />}
                          onClick={() => setMovementModal({ kind: "SALE", row })}
                        />
                        <MobileIconAction
                          label="Historico"
                          icon={<History className="h-3.5 w-3.5" />}
                          onClick={() => openHistory(row)}
                        />
                      </div>
                    </td>
                    <Cell className="hidden md:table-cell">{row.brandName}</Cell>
                    <Cell className="hidden md:table-cell">{row.categoryName}</Cell>
                    <Cell className="hidden md:table-cell">{row.supplierName ?? "—"}</Cell>
                    <Cell className="hidden md:table-cell">
                      <input
                        value={getDraftValue(row, "salePrice")}
                        onChange={(event) => updateDraft(row, "salePrice", event.target.value)}
                        onFocus={(event) => event.currentTarget.select()}
                        inputMode="decimal"
                        placeholder="0,00"
                        className="h-10 w-28 rounded-xl border border-[color:var(--line)] px-3"
                      />
                    </Cell>
                    <Cell className="hidden md:table-cell">
                      {showUnitCostColumn ? (
                        <input
                          value={getDraftValue(row, "unitCost")}
                          onChange={(event) => updateDraft(row, "unitCost", event.target.value)}
                          onFocus={(event) => event.currentTarget.select()}
                          inputMode="decimal"
                          placeholder=""
                          className="h-10 w-28 rounded-xl border border-[color:var(--line)] px-3"
                        />
                      ) : (
                        <span className="text-slate-300"> </span>
                      )}
                    </Cell>
                    <Cell className="hidden md:table-cell">
                      <input
                        value={getDraftValue(row, "stock")}
                        onChange={(event) => updateDraft(row, "stock", event.target.value)}
                        onFocus={(event) => event.currentTarget.select()}
                        inputMode="numeric"
                        placeholder=""
                        className="h-10 w-24 rounded-xl border border-[color:var(--line)] px-3"
                      />
                    </Cell>
                    <Cell className="hidden md:table-cell">
                      <input
                        value={getDraftValue(row, "lowStockAlert")}
                        onChange={(event) => updateDraft(row, "lowStockAlert", event.target.value)}
                        onFocus={(event) => event.currentTarget.select()}
                        inputMode="numeric"
                        placeholder=""
                        className="h-10 w-24 rounded-xl border border-[color:var(--line)] px-3"
                      />
                    </Cell>
                    <Cell className="hidden md:table-cell">{row.outputs}</Cell>
                    <Cell className="hidden xl:table-cell">{formatPrice(row.investedValueInCents)}</Cell>
                    <Cell className="hidden xl:table-cell">{formatPrice(row.potentialSalesValueInCents)}</Cell>
                    <Cell className="hidden xl:table-cell">
                      {row.potentialProfitInCents === null ? (
                        <span className="text-xs text-slate-500">Custo por definir</span>
                      ) : (
                        formatPrice(row.potentialProfitInCents)
                      )}
                    </Cell>
                    <Cell className="hidden md:table-cell">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStockStatusTone(
                          row.status,
                        )}`}
                      >
                        {getStockStatusLabel(row.status)}
                      </span>
                    </Cell>
                    <Cell className="hidden lg:table-cell">{new Date(row.lastUpdatedAt).toLocaleString("pt-PT")}</Cell>
                    <td className="hidden z-10 border-b border-[color:var(--line)] bg-white px-2 py-4 md:sticky md:right-0 md:table-cell md:px-4">
                      <div className="flex min-w-[92px] flex-wrap gap-2 md:min-w-[220px]">
                        {hasDraft ? (
                          <button
                            type="button"
                            onClick={() => saveQuickRow(row)}
                            disabled={isSavingRow || isSavingAll}
                            className="inline-flex items-center gap-1 rounded-full bg-[color:var(--atlantic)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{isSavingRow ? "A guardar..." : "Guardar"}</span>
                          </button>
                        ) : null}
                        <ActionButton
                          label="Saida"
                          icon={<PackageX className="h-3.5 w-3.5" />}
                          onClick={() => setMovementModal({ kind: "SALE", row })}
                          mobileIconOnly
                        />
                        <ActionButton
                          label="Historico"
                          icon={<History className="h-3.5 w-3.5" />}
                          onClick={() => openHistory(row)}
                          mobileIconOnly
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[color:var(--line)] px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Pagina {pagination.currentPage} de {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={pagination.currentPage === 1}
              className="rounded-full border border-[color:var(--line)] px-4 py-2 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="rounded-full border border-[color:var(--line)] px-4 py-2 disabled:opacity-40"
            >
              Seguinte
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-[color:var(--line)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportExcel("filtered")}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-[color:var(--cocoa)] px-4 text-sm font-medium text-white"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar filtrados
            </button>
            <button
              type="button"
              onClick={() => exportExcel("all")}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm font-medium text-[color:var(--ink)]"
            >
              <Download className="h-4 w-4" />
              Exportar stock
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm font-medium text-[color:var(--ink)]"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
            <a
              href="/api/admin/stock/template"
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm font-medium text-[color:var(--ink)]"
            >
              <Download className="h-4 w-4" />
              Modelo Excel
            </a>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="inline-flex h-10 min-w-0 items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-white px-3 text-sm text-slate-600">
              <Upload className="h-4 w-4 shrink-0" />
              <span className="truncate">{importFile?.name ?? "Escolher ficheiro Excel"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-white px-4 text-sm font-medium text-[color:var(--ink)]"
            >
              <Upload className="h-4 w-4" />
              Ficheiro
            </button>
            <button
              type="button"
              onClick={previewImport}
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[color:var(--atlantic)] px-4 text-sm font-semibold text-white"
            >
              <Upload className="h-4 w-4" />
              Importar Excel
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <SummaryCard label="Produtos" value={summary.totalProducts} helper="Itens visiveis na tabela atual." />
        <SummaryCard label="Unidades" value={summary.totalUnits} helper="Total de stock somado nesta vista." />
        <SummaryCard label="Stock baixo" value={summary.lowStockProducts} helper="Produtos abaixo do limite de alerta." />
        <SummaryCard label="Esgotados" value={summary.outOfStockProducts} helper="Produtos sem unidades disponiveis." />
        <SummaryCard label="Investido" value={formatPrice(summary.totalInvestedInCents)} helper="Baseado no custo unitario atual." />
        <SummaryCard label="Venda potencial" value={formatPrice(summary.totalPotentialSalesInCents)} helper="Valor bruto do stock atual." />
        <SummaryCard label="Lucro potencial" value={formatPrice(summary.totalPotentialProfitInCents)} helper="Ignora produtos sem custo definido." />
      </section>

      {movementModal ? (
        <ModalFrame
          title={getModalTitle(movementModal.kind, movementModal.row.name)}
          onClose={() => setMovementModal(null)}
        >
          {movementModal.kind === "HISTORY" ? (
            historyLoading ? (
              <p className="text-sm text-slate-500">A carregar historico...</p>
            ) : historyRows.length ? (
              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {historyRows.map((movement) => (
                  <div key={movement.id} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--ink)]">
                          {getMovementTypeLabel(movement.type)}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteHistoryMovement(movementModal.row, movement)}
                          disabled={deletingMovementId === movement.id}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingMovementId === movement.id ? "A apagar..." : "Apagar"}
                        </button>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(movement.createdAt).toLocaleString("pt-PT")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">
                      Quantidade {movement.quantity} · {movement.previousStock} → {movement.resultingStock}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Motivo {getMovementReasonLabel(movement.reason)}
                    </p>
                    {movement.customerName ? (
                      <p className="mt-1 text-sm text-slate-500">Cliente {movement.customerName}</p>
                    ) : null}
                    {movement.unitCostInCents !== null ? (
                      <p className="mt-1 text-sm text-slate-500">
                        Custo unitario {formatPrice(movement.unitCostInCents)}
                      </p>
                    ) : null}
                    {movement.supplier ? (
                      <p className="mt-1 text-sm text-slate-500">Fornecedor {movement.supplier}</p>
                    ) : null}
                    {movement.notes ? <p className="mt-1 text-sm text-slate-500">{movement.notes}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Ainda nao existem movimentos registados para este produto.</p>
            )
          ) : movementModal.kind === "NOTES" ? (
            <form className="space-y-4" onSubmit={(event) => submitNotes(event, movementModal.row)}>
              <textarea
                name="stockNotes"
                defaultValue={movementModal.row.stockNotes ?? ""}
                className="min-h-32 w-full rounded-2xl border border-[color:var(--line)] px-4 py-3"
                placeholder="Notas internas, fornecedor habitual ou observacoes."
              />
              <div className="flex justify-end">
                <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white">
                  Guardar notas
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={(event) => submitMovement(event, movementModal.row)}>
              <input type="hidden" name="type" value={movementModal.kind} />
              {movementModal.kind === "ENTRY" ? (
                <>
                  <Field label="Quantidade">
                    <input name="quantity" type="number" min="1" required className="h-12 w-full rounded-2xl border border-[color:var(--line)] px-4" />
                  </Field>
                  <Field label="Custo unitario (opcional)">
                    <input name="unitCost" inputMode="decimal" className="h-12 w-full rounded-2xl border border-[color:var(--line)] px-4" placeholder="Ex: 18,50" />
                  </Field>
                  <Field label="Fornecedor (opcional)">
                    <input name="supplier" className="h-12 w-full rounded-2xl border border-[color:var(--line)] px-4" placeholder="Fornecedor ou origem da reposicao" />
                  </Field>
                </>
              ) : null}

              {movementModal.kind === "SALE" ? (
                <>
                  <Field label="Quantidade">
                    <input name="quantity" type="number" min="1" required className="h-12 w-full rounded-2xl border border-[color:var(--line)] px-4" />
                  </Field>
                  <Field label="Cliente">
                    <>
                      <input
                        name="customerName"
                        list="stock-customer-names"
                        required
                        minLength={2}
                        className="h-12 w-full rounded-2xl border border-[color:var(--line)] px-4"
                        placeholder="Nome da pessoa que compra"
                      />
                      <datalist id="stock-customer-names">
                        {customerNames.map((customerName) => (
                          <option key={customerName} value={customerName} />
                        ))}
                      </datalist>
                    </>
                  </Field>
                  <Field label="Motivo">
                    <select name="reason" required className="h-12 w-full rounded-2xl border border-[color:var(--line)] px-4">
                      <option value="">Selecionar motivo</option>
                      <option value={StockMovementReason.SALE}>Venda</option>
                      <option value={StockMovementReason.GIFT}>Oferta</option>
                      <option value={StockMovementReason.LOSS}>Quebra/perda</option>
                      <option value={StockMovementReason.DECANT}>Decant</option>
                      <option value={StockMovementReason.INTERNAL_USE}>Uso interno</option>
                      <option value={StockMovementReason.OTHER}>Outro</option>
                    </select>
                  </Field>
                </>
              ) : null}

              {movementModal.kind === "ADJUSTMENT" ? (
                <Field label="Novo stock">
                  <input
                    name="nextStock"
                    type="number"
                    min="0"
                    required
                    defaultValue={movementModal.row.stock}
                    className="h-12 w-full rounded-2xl border border-[color:var(--line)] px-4"
                  />
                </Field>
              ) : null}

              <Field label="Notas">
                <textarea
                  name="notes"
                  className="min-h-28 w-full rounded-2xl border border-[color:var(--line)] px-4 py-3"
                  placeholder="Detalhes internos do movimento."
                />
              </Field>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMovementModal(null)}
                  className="rounded-full border border-[color:var(--line)] px-4 py-3 text-sm font-medium text-slate-700"
                >
                  Cancelar
                </button>
                <button className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white">
                  Guardar movimento
                </button>
              </div>
            </form>
          )}
        </ModalFrame>
      ) : null}

      {showImportPanel ? (
        <ModalFrame title="Pre-visualizacao da importacao Excel" onClose={() => setShowImportPanel(false)}>
          <div className="space-y-4">
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                importHasErrors
                  ? "border border-rose-200 bg-rose-50 text-rose-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {importHasErrors
                ? "Foram encontrados erros. Corrija o ficheiro antes de confirmar."
                : `${importPreviewRows.length} linha(s) prontas para importar.`}
            </div>

            <div className="max-h-[55vh] overflow-auto rounded-2xl border border-[color:var(--line)]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-[color:var(--sand-soft)] text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Linha</th>
                    <th className="px-3 py-3">Produto</th>
                    <th className="px-3 py-3">Alteracoes</th>
                    <th className="px-3 py-3">Erros</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreviewRows.map((previewRow) => (
                    <tr key={`${previewRow.productId}-${previewRow.rowNumber}`} className="border-t border-[color:var(--line)] align-top">
                      <td className="px-3 py-3">{previewRow.rowNumber}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-[color:var(--ink)]">{previewRow.productName}</p>
                        <p className="text-xs text-slate-500">{previewRow.productId}</p>
                      </td>
                      <td className="px-3 py-3">
                        {previewRow.changes.length ? (
                          <div className="space-y-1">
                            {previewRow.changes.map((change) => (
                              <p key={change} className="text-slate-600">
                                {change}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">Sem alteracoes</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {previewRow.errors.length ? (
                          <div className="space-y-1 text-rose-700">
                            {previewRow.errors.map((error) => (
                              <p key={error}>{error}</p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-emerald-700">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportPanel(false)}
                className="rounded-full border border-[color:var(--line)] px-4 py-3 text-sm font-medium text-slate-700"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={commitImport}
                disabled={importHasErrors}
                className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Confirmar importacao
              </button>
            </div>
          </div>
        </ModalFrame>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <article className="rounded-[1.45rem] border border-[color:var(--line)] bg-white px-4 py-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--atlantic)]">{label}</p>
      <p className="mt-3 font-serif text-3xl text-[color:var(--ink)]">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </article>
  );
}

function CompactSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-2xl border border-[color:var(--line)] bg-white px-3 text-sm text-[color:var(--ink)] outline-none"
    >
      {children}
    </select>
  );
}

function MobileInlineInput({
  value,
  onChange,
  inputMode,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  inputMode: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onFocus={(event) => event.currentTarget.select()}
      inputMode={inputMode}
      placeholder={placeholder}
      disabled={disabled}
      className="h-8 min-w-0 w-full border-0 bg-transparent px-0 text-center text-[15px] font-semibold leading-tight text-[color:var(--ink)] tabular-nums outline-none ring-0 disabled:text-slate-300"
      style={{ fontSize: "16px", WebkitTextSizeAdjust: "100%" }}
    />
  );
}

function MobileIconAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--line)] bg-white text-slate-700"
    >
      {icon}
    </button>
  );
}

function TableHeader({
  title,
  active,
  direction,
  onClick,
  sticky = false,
  className = "",
}: {
  title: string;
  active: boolean;
  direction: StockSortDirection;
  onClick: () => void;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <th
      className={`${sticky ? "sticky left-0 top-0 z-20" : "sticky top-0 z-10"} border-b border-[color:var(--line)] bg-[color:var(--sand-soft)] px-4 py-4 ${className}`}
    >
      <button type="button" onClick={onClick} className="inline-flex items-center gap-2 text-left">
        <span>{title}</span>
        <span className={`text-[10px] ${active ? "text-[color:var(--ink)]" : "text-slate-400"}`}>
          {active ? (direction === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

function Cell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`border-b border-[color:var(--line)] px-4 py-4 text-slate-700 ${className}`}>{children}</td>;
}

function ActionButton({
  label,
  icon,
  onClick,
  mobileIconOnly = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  mobileIconOnly?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line)] px-3 py-2 text-xs font-medium text-slate-700"
    >
      {icon}
      <span className={mobileIconOnly ? "hidden sm:inline" : ""}>{label}</span>
    </button>
  );
}

function ModalFrame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[color:var(--line)] px-6 py-4">
          <h2 className="font-serif text-2xl text-[color:var(--ink)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[color:var(--line)] px-3 py-1.5 text-sm text-slate-600"
          >
            Fechar
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function getModalTitle(
  kind: "ENTRY" | "SALE" | "ADJUSTMENT" | "HISTORY" | "NOTES",
  productName: string,
) {
  switch (kind) {
    case "ENTRY":
      return `Entrada de stock · ${productName}`;
    case "SALE":
      return `Saida de stock · ${productName}`;
    case "ADJUSTMENT":
      return `Ajuste manual · ${productName}`;
    case "HISTORY":
      return `Historico · ${productName}`;
    case "NOTES":
      return `Notas internas · ${productName}`;
    default:
      return productName;
  }
}

function parseEuroInputToCents(value: string) {
  const normalized = value.trim().replace("€", "").replace(/\s+/g, "").replace(",", ".");
  if (!normalized) {
    return 0;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return Math.round(parsed * 100);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseWholeNumberInput(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function rowHasPendingChanges(row: AdminStockRow, draft: DraftRowState) {
  return (
    parseEuroInputToCents(draft.salePrice) !== row.salePriceInCents ||
    draft.stock !== String(row.stock) ||
    draft.lowStockAlert !== String(row.lowStockAlert) ||
    parseEuroInputToCents(draft.unitCost) !== row.unitCostInCents ||
    draft.stockNotes !== (row.stockNotes ?? "")
  );
}

function applyMovementLocally(
  row: AdminStockRow,
  payload:
    | {
        type: "ADJUSTMENT";
        nextStock: number;
        notes: string;
      }
    | {
        type: "ENTRY" | "SALE";
        quantity: number;
        unitCost: string;
        supplier: string;
        customerName: string;
        reason: StockMovementReason | null;
        notes: string;
      },
) {
  const now = new Date().toISOString();
  let nextStock = row.stock;
  let nextEntries = row.entries;
  let nextOutputs = row.outputs;
  let nextUnitCost = row.unitCostInCents;

  if (payload.type === StockMovementType.ENTRY) {
    nextStock = row.stock + payload.quantity;
    nextEntries = row.entries + payload.quantity;
    const payloadCost = parseEuroInputToCents(payload.unitCost);
    if (payloadCost > 0) {
      nextUnitCost = payloadCost;
    }
  }

  if (payload.type === StockMovementType.SALE) {
    nextStock = Math.max(0, row.stock - payload.quantity);
    nextOutputs = row.outputs + payload.quantity;
  }

  if (payload.type === StockMovementType.ADJUSTMENT) {
    nextStock = payload.nextStock;
  }

  return {
    ...row,
    stock: nextStock,
    entries: nextEntries,
    outputs: nextOutputs,
    unitCostInCents: nextUnitCost,
    investedValueInCents: nextStock * nextUnitCost,
    potentialSalesValueInCents: nextStock * row.salePriceInCents,
    potentialProfitInCents:
      nextUnitCost > 0 ? nextStock * (row.salePriceInCents - nextUnitCost) : null,
    customerNames:
      payload.type === StockMovementType.SALE && payload.customerName.trim()
        ? Array.from(new Set([...row.customerNames, payload.customerName.trim()])).sort((left, right) =>
            left.localeCompare(right, "pt-PT"),
          )
        : row.customerNames,
    status: getStockStatus(nextStock, row.lowStockAlert),
    lastUpdatedAt: now,
    updatedAt: now,
  };
}
