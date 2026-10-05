"use client";

import { type Brand, type Category, StockDeliveryStatus, StockMovementReason, StockMovementType, StockSaleStatus } from "@prisma/client";
import {
  Download,
  Filter,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { InventoryWorkspace } from "./inventory-workspace";
import { InventoryDialog } from "./inventory-dialog";
import { formatPrice } from "@/lib/format";
import {
  type AdminStockMovementRow,
  type AdminStockRow,
  type StockCustomerSummary,
  type StockImportPreviewRow,
  getMovementReasonLabel,
  getMovementTypeLabel,
  getStockStatus,
  getStockOutputs,
  getStockStatusLabel,
  normalizeStockSearch,
} from "@/lib/stock";

type Props = {
  rows: AdminStockRow[];
  brands: Brand[];
  categories: Category[];
  customerNames: string[];
  customerSummaries: StockCustomerSummary[];
  initialView?: "NEW_SALE" | "SALES" | "STOCK";
  initialSalesStatus?: "ALL" | StockSaleStatus;
  initialDeliveryStatus?: "ALL" | StockDeliveryStatus;
  initialSalesPeriod?: "ALL" | "MONTH";
  initialStockStatus?: "all" | "LOW";
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

type StockSaleRow = {
  id: string;
  customerName: string;
  saleOrigin: string | null;
  status: StockSaleStatus;
  deliveryStatus: StockDeliveryStatus;
  createdAt: string;
  totalInCents: number;
  items: { id: string; productId: string; name: string; quantity: number; unitPriceInCents: number; status: StockSaleStatus; deliveryStatus: StockDeliveryStatus; sizeMl: 5 | 10 | null; notes: string | null }[];
};

const SALE_ORIGINS = ["WhatsApp", "Instagram", "Facebook", "Site", "Feira", "Presencial", "Google", "Outro"] as const;

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function StockAdminTable({
  rows: initialRows,
  customerNames: initialCustomerNames,
  customerSummaries: initialCustomerSummaries,
  initialView = "NEW_SALE",
  initialSalesStatus = "ALL",
  initialDeliveryStatus = "ALL",
  initialSalesPeriod = "MONTH",
  initialStockStatus = "all",
}: Props) {
  const [rows, setRows] = useState(initialRows);
  const [customerNames, setCustomerNames] = useState(initialCustomerNames);
  const [, setCustomerSummaries] = useState(initialCustomerSummaries);
  const [banner, setBanner] = useState<BannerState>(null);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [movementModal, setMovementModal] = useState<MovementModalState>(null);
  const [historyRows, setHistoryRows] = useState<AdminStockMovementRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreviewRows, setImportPreviewRows] = useState<StockImportPreviewRow[]>([]);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [activeView, setActiveView] = useState<"NEW_SALE" | "SALES" | "STOCK" | "PERFUMES" | "DECANTS">(initialView);
  const [decantMode, setDecantMode] = useState<"KIT" | "INDIVIDUAL">("KIT");
  const [savingDecantSale, setSavingDecantSale] = useState(false);
  const [decantLineIds, setDecantLineIds] = useState([0]);
  const [savingPerfumeSale, setSavingPerfumeSale] = useState(false);
  const [perfumeLineIds, setPerfumeLineIds] = useState([0]);
  const [combinedDecantMode, setCombinedDecantMode] = useState<"NONE" | "KIT" | "INDIVIDUAL">("NONE");
  const [savingCombinedSale, setSavingCombinedSale] = useState(false);
  const [sales, setSales] = useState<StockSaleRow[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesStatusFilter, setSalesStatusFilter] = useState<"ALL" | StockSaleStatus>(initialSalesStatus);
  const [salesDeliveryFilter, setSalesDeliveryFilter] = useState<"ALL" | StockDeliveryStatus>(initialDeliveryStatus);
  const [salesKindFilter, setSalesKindFilter] = useState<"ALL" | "BOTTLE" | "DECANT_5" | "DECANT_10" | "KIT">("ALL");
  const [salesQuery, setSalesQuery] = useState("");
  const [salesPendingOnly, setSalesPendingOnly] = useState(false);
  const [salesFrom, setSalesFrom] = useState(() => initialSalesPeriod === "ALL" ? "" : localDateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [salesTo, setSalesTo] = useState(() => initialSalesPeriod === "ALL" ? "" : localDateKey(new Date()));
  const [salesPeriod, setSalesPeriod] = useState<"ALL" | "TODAY" | "7D" | "MONTH" | "CUSTOM">(initialSalesPeriod);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [customerHistoryName, setCustomerHistoryName] = useState<string | null>(null);
  const [newSaleCustomerName, setNewSaleCustomerName] = useState("");
  const [salesPage, setSalesPage] = useState(1);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [savingSaleId, setSavingSaleId] = useState<string | null>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [updatingSaleFields, setUpdatingSaleFields] = useState<string[]>([]);
  const [importHasErrors, setImportHasErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function exportExcel() { window.location.href = "/api/admin/stock/export?scope=all"; }

  function exportPdf() {
    const printableRows = rows.map((row) => ({
      product: row.name,
      brand: row.brandName,
      category: row.categoryName,
      supplier: row.supplierName ?? "—",
      salePrice: formatPrice(row.salePriceInCents),
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
          <p>${rows.length} produtos • ${today}</p>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Marca</th>
                <th>Categoria</th>
                <th>Fornecedor</th>
                <th>Preço</th>
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

  async function submitDecantSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const productIds = decantMode === "KIT"
      ? [1, 2, 3, 4, 5].map((position) => formData.get(`product${position}`)?.toString() ?? "")
      : decantLineIds.map((id) => formData.get(`decantProduct${id}`)?.toString() ?? "");
    const lines = decantMode === "INDIVIDUAL" ? decantLineIds.map((id) => ({
      productId: formData.get(`decantProduct${id}`)?.toString() ?? "",
      sizeMl: Number(formData.get(`decantSize${id}`)),
      quantity: Number(formData.get(`decantQuantity${id}`)),
    })) : undefined;

    setSavingDecantSale(true);
    setBanner(null);
    try {
      const response = await fetch("/api/admin/stock/decants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: decantMode,
          productIds,
          customerName: formData.get("customerName")?.toString() ?? "",
          saleOrigin: formData.get("saleOrigin")?.toString() || null,
          ...(decantMode === "KIT" ? { sizeMl: 5, quantity: 1 } : { lines }),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível registar a venda de decants.");
      setBanner({ tone: "success", message: decantMode === "KIT" ? "Kit de 5 decants vendido por 16,50 €." : "Venda individual de decant registada." });
      window.location.reload();
    } catch (error) {
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Não foi possível registar a venda." });
    } finally {
      setSavingDecantSale(false);
    }
  }

  async function submitPerfumeSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSavingPerfumeSale(true);
    setBanner(null);
    try {
      const response = await fetch("/api/admin/stock/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.get("customerName")?.toString() ?? "",
          saleOrigin: formData.get("saleOrigin")?.toString() || null,
          lines: perfumeLineIds.map((id) => ({
            productId: formData.get(`perfumeProduct${id}`)?.toString() ?? "",
            quantity: Number(formData.get(`perfumeQuantity${id}`)),
          })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível registar a venda de perfumes.");
      window.location.reload();
    } catch (error) {
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Não foi possível registar a venda." });
    } finally {
      setSavingPerfumeSale(false);
    }
  }

  async function submitCombinedSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const perfumeLines = perfumeLineIds.map((id) => ({
      productId: formData.get(`combinedPerfume${id}`)?.toString() ?? "",
      quantity: Number(formData.get(`combinedPerfumeQuantity${id}`)),
    })).filter((line) => line.productId);
    const decantLines = combinedDecantMode === "INDIVIDUAL" ? decantLineIds.map((id) => ({
      productId: formData.get(`combinedDecant${id}`)?.toString() ?? "",
      sizeMl: Number(formData.get(`combinedDecantSize${id}`)),
      quantity: Number(formData.get(`combinedDecantQuantity${id}`)),
    })).filter((line) => line.productId) : [];
    const kitProductIds = combinedDecantMode === "KIT"
      ? [1, 2, 3, 4, 5].map((position) => formData.get(`combinedKit${position}`)?.toString() ?? "")
      : [];
    const kitQuantity = combinedDecantMode === "KIT"
      ? Number(formData.get("combinedKitQuantity"))
      : 1;
    setSavingCombinedSale(true);
    setBanner(null);
    try {
      const response = await fetch("/api/admin/stock/sales/combined", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.get("customerName")?.toString() ?? "",
          saleOrigin: formData.get("saleOrigin")?.toString() || null,
          status: formData.get("status"),
          deliveryStatus: formData.get("deliveryStatus"),
          perfumeLines,
          decantLines,
          kitProductIds,
          kitQuantity,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível registar a venda.");
      window.location.reload();
    } catch (error) {
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Não foi possível registar a venda." });
    } finally {
      setSavingCombinedSale(false);
    }
  }

  async function loadSales() {
    setActiveView("SALES");
    setSalesLoading(true);
    try {
      const response = await fetch("/api/admin/stock/sales");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar as vendas.");
      setSales(payload.sales ?? []);
      setSalesPage(1);
    } catch (error) {
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Não foi possível carregar as vendas." });
    } finally {
      setSalesLoading(false);
    }
  }

  useEffect(() => {
    if (initialView !== "SALES") return;
    const loadTimer = window.setTimeout(() => { void loadSales(); }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [initialView]);

  async function updateSaleStatus(saleGroupId: string, status: StockSaleStatus) {
    const key = `${saleGroupId}:payment`;
    if (updatingSaleFields.includes(key)) return;
    const previous = sales.find((sale) => sale.id === saleGroupId)?.status;
    if (!previous || previous === status) return;
    setUpdatingSaleFields((current) => [...current, key]);
    setSales((current) => current.map((sale) => sale.id === saleGroupId ? { ...sale, status, items: sale.items.map((item) => ({ ...item, status })) } : sale));
    try {
      const response = await fetch("/api/admin/stock/sales", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saleGroupId, status }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível alterar o pagamento.");
    } catch (error) {
      setSales((current) => current.map((sale) => sale.id === saleGroupId ? { ...sale, status: previous, items: sale.items.map((item) => ({ ...item, status: previous })) } : sale));
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Não foi possível alterar o pagamento." });
    } finally {
      setUpdatingSaleFields((current) => current.filter((entry) => entry !== key));
    }
  }

  async function updateDeliveryStatus(saleGroupId: string, deliveryStatus: StockDeliveryStatus) {
    const key = `${saleGroupId}:delivery`;
    if (updatingSaleFields.includes(key)) return;
    const previous = sales.find((sale) => sale.id === saleGroupId)?.deliveryStatus;
    if (!previous || previous === deliveryStatus) return;
    setUpdatingSaleFields((current) => [...current, key]);
    setSales((current) => current.map((sale) => sale.id === saleGroupId ? { ...sale, deliveryStatus, items: sale.items.map((item) => ({ ...item, deliveryStatus })) } : sale));
    try {
      const response = await fetch("/api/admin/stock/sales", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saleGroupId, deliveryStatus }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível alterar a entrega.");
    } catch (error) {
      setSales((current) => current.map((sale) => sale.id === saleGroupId ? { ...sale, deliveryStatus: previous, items: sale.items.map((item) => ({ ...item, deliveryStatus: previous })) } : sale));
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Não foi possível alterar a entrega." });
    } finally {
      setUpdatingSaleFields((current) => current.filter((entry) => entry !== key));
    }
  }

  async function saveSaleEdits(event: React.FormEvent<HTMLFormElement>, sale: StockSaleRow) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSavingSaleId(sale.id);
    try {
      const response = await fetch("/api/admin/stock/sales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleGroupId: sale.id,
          customerName: formData.get("customerName")?.toString() ?? "",
          saleOrigin: formData.get("saleOrigin")?.toString() || null,
          items: sale.items.map((item) => ({
            movementId: item.id,
            productId: formData.get(`saleItem${item.id}`)?.toString() ?? item.productId,
            status: formData.get(`saleItemStatus${item.id}`) ?? (item.notes?.includes("Kit de decants") ? formData.get("kitStatus") : null),
            deliveryStatus: formData.get(`saleItemDelivery${item.id}`) ?? (item.notes?.includes("Kit de decants") ? formData.get("kitDelivery") : null),
            sizeMl: item.notes?.includes("Decant individual") ? Number(formData.get(`saleItemSize${item.id}`)) : undefined,
          })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível guardar a venda.");
      await loadSales();
      setExpandedSaleId(null);
    } catch (error) {
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Não foi possível guardar a venda." });
    } finally {
      setSavingSaleId(null);
    }
  }

  async function deleteSale(sale: StockSaleRow) {
    const saleDate = new Date(sale.createdAt).toLocaleDateString("pt-PT");
    if (!window.confirm(`Eliminar a venda de ${sale.customerName}, de ${saleDate}, no valor de ${formatPrice(sale.totalInCents)}? Esta ação não pode ser anulada.`)) return;

    setDeletingSaleId(sale.id);
    setBanner(null);
    try {
      const response = await fetch("/api/admin/stock/sales", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleGroupId: sale.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível eliminar a venda.");
      window.location.reload();
    } catch (error) {
      setBanner({ tone: "error", message: error instanceof Error ? error.message : "Não foi possível eliminar a venda." });
      setDeletingSaleId(null);
    }
  }

  const filteredSales = useMemo(() => {
    const query = normalizeStockSearch(salesQuery);
    return sales.filter((sale) => {
      if (salesPendingOnly && sale.status !== StockSaleStatus.PENDING && sale.deliveryStatus !== StockDeliveryStatus.PENDING) return false;
      if (salesStatusFilter !== "ALL" && sale.status !== salesStatusFilter) return false;
      if (salesDeliveryFilter !== "ALL" && sale.deliveryStatus !== salesDeliveryFilter) return false;
      const date = sale.createdAt.slice(0, 10);
      if (salesFrom && date < salesFrom || salesTo && date > salesTo) return false;
      if (query && !normalizeStockSearch(`${sale.customerName} ${sale.items.map((item) => item.name).join(" ")}`).includes(query)) return false;
      if (salesKindFilter === "BOTTLE" && !sale.items.some((item) => !item.notes?.includes("Decant"))) return false;
      if (salesKindFilter === "DECANT_5" && !sale.items.some((item) => item.notes?.includes("Decant individual") && item.sizeMl !== 10)) return false;
      if (salesKindFilter === "DECANT_10" && !sale.items.some((item) => item.notes?.includes("Decant individual") && item.sizeMl === 10)) return false;
      if (salesKindFilter === "KIT" && !sale.items.some((item) => item.notes?.includes("Kit de decants"))) return false;
      return true;
    }).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [sales, salesDeliveryFilter, salesFrom, salesKindFilter, salesPendingOnly, salesQuery, salesStatusFilter, salesTo]);
  const periodSales = useMemo(() => sales.filter((sale) => {
    const date = sale.createdAt.slice(0, 10);
    return (!salesFrom || date >= salesFrom) && (!salesTo || date <= salesTo);
  }), [sales, salesFrom, salesTo]);
  const periodPaidValue = getItemStatusTotal(periodSales, StockSaleStatus.PAID);
  const periodPendingValue = getItemStatusTotal(periodSales, StockSaleStatus.PENDING);
  const activeSalesFilterCount = [salesStatusFilter !== "ALL", salesDeliveryFilter !== "ALL", salesKindFilter !== "ALL", salesPendingOnly, salesPeriod === "CUSTOM" && Boolean(salesFrom), salesPeriod === "CUSTOM" && Boolean(salesTo)].filter(Boolean).length;
  const customerHistory = useMemo(() => customerHistoryName ? sales.filter((sale) => normalizeStockSearch(sale.customerName) === normalizeStockSearch(customerHistoryName)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [], [customerHistoryName, sales]);
  const salesTotalPages = Math.max(1, Math.ceil(filteredSales.length / 25));
  const pagedSales = filteredSales.slice((salesPage - 1) * 25, salesPage * 25);

  function applySalesPeriod(period: typeof salesPeriod) {
    const today = new Date();
    setSalesPeriod(period);
    setSalesPage(1);
    if (period === "CUSTOM") { setMobileFiltersOpen(true); return; }
    if (period === "ALL") {
      setSalesFrom("");
      setSalesTo("");
      return;
    }
    const from = new Date(today);
    if (period === "7D") from.setDate(today.getDate() - 6);
    if (period === "MONTH") from.setDate(1);
    setSalesFrom(localDateKey(from));
    setSalesTo(localDateKey(today));
  }

  function clearSalesFilters() {
    setSalesQuery("");
    setSalesStatusFilter("ALL");
    setSalesDeliveryFilter("ALL");
    setSalesKindFilter("ALL");
    setSalesPendingOnly(false);
    const today = new Date();
    setSalesFrom(localDateKey(new Date(today.getFullYear(), today.getMonth(), 1)));
    setSalesTo(localDateKey(today));
    setSalesPeriod("MONTH");
    setSalesPage(1);
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
                customerSales: currentRow.customerSales.map((sale) =>
                  sale.customerName === movement.customerName?.trim()
                    ? { ...sale, quantity: Math.max(0, sale.quantity - movement.quantity) }
                    : sale,
                ).filter((sale) => sale.quantity > 0),
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
          stock: row.stock,
          lowStockAlert: row.lowStockAlert,
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
      {banner ? <p role={banner.tone === "error" ? "alert" : "status"} className={`rounded-xl p-3 text-sm ${banner.tone === "error" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{banner.message}</p> : null}
      {activeView === "STOCK" ? <InventoryWorkspace rows={rows} initialStatus={initialStockStatus} onUpdate={(next) => setRows((current) => current.map((row) => row.id === next.id ? next : row))} onHistory={openHistory} onEntry={(row) => setMovementModal({ kind: "ENTRY", row })} onNotes={(row) => setMovementModal({ kind: "NOTES", row })} tools={<>      <section className="rounded-[1.8rem] border border-[color:var(--line)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportExcel()}
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

</>} /> : null}

      {movementModal ? (
        <ModalFrame
          title={getModalTitle(movementModal.kind, movementModal.row.name)}
          onClose={() => setMovementModal(null)}
        >
          {movementModal.kind === "HISTORY" ? (
            historyLoading ? (
              <p className="text-sm text-slate-500">A carregar histórico...</p>
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
                    {movement.supplier ? (
                      <p className="mt-1 text-sm text-slate-500">Fornecedor {movement.supplier}</p>
                    ) : null}
                    {movement.notes ? <p className="mt-1 text-sm text-slate-500">{movement.notes}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Ainda não existem movimentos registados para este produto.</p>
            )
          ) : movementModal.kind === "NOTES" ? (
            <form className="space-y-4" onSubmit={(event) => submitNotes(event, movementModal.row)}>
              <textarea
                name="stockNotes"
                defaultValue={movementModal.row.stockNotes ?? ""}
                className="min-h-32 w-full rounded-2xl border border-[color:var(--line)] px-4 py-3"
                placeholder="Notas internas, fornecedor habitual ou observações."
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

      {activeView === "NEW_SALE" ? (
        <section className="rounded-[1.8rem] border border-[color:var(--line)] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">Nova venda</h2>
          <form className="mt-5 space-y-6" onSubmit={submitCombinedSale}>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Cliente"><input name="customerName" value={newSaleCustomerName} onChange={(event) => setNewSaleCustomerName(event.target.value)} list="combined-customer-names" required minLength={2} className="h-12 w-full rounded-2xl border border-[color:var(--line)] px-4" placeholder="Nome da pessoa que compra" /></Field>
              <Field label="Estado da venda">
                <select name="status" required defaultValue={StockSaleStatus.PAID} className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4">
                  <option value={StockSaleStatus.PAID}>Pago</option>
                  <option value={StockSaleStatus.PENDING}>Por pagar · aguardar entrega/pagamento</option>
                  <option value={StockSaleStatus.OFFERED}>Oferecido</option>
                </select>
              </Field>
              <Field label="Estado da entrega">
                <select name="deliveryStatus" required defaultValue={StockDeliveryStatus.DELIVERED} className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4">
                  <option value={StockDeliveryStatus.DELIVERED}>Entregue</option>
                  <option value={StockDeliveryStatus.PENDING}>Por entregar</option>
                </select>
              </Field>
              <Field label="Origem da venda">
                <select name="saleOrigin" defaultValue="" className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4">
                  <option value="">Não indicada</option>
                  {SALE_ORIGINS.map((origin) => <option key={origin} value={origin}>{origin}</option>)}
                </select>
              </Field>
            </div>
            <datalist id="combined-customer-names">{customerNames.map((name) => <option key={name} value={name} />)}</datalist>

            <div className="grid items-start gap-5 xl:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-4">
                <h3 className="font-serif text-2xl text-[color:var(--ink)]">Perfumes</h3>
                <div className="mt-4 space-y-3">
                  {perfumeLineIds.map((id, index) => (
                    <SaleLine key={id} label={`Perfume ${index + 1}`} onRemove={perfumeLineIds.length > 1 ? () => setPerfumeLineIds((current) => current.filter((lineId) => lineId !== id)) : undefined}>
                      <SearchableProductSelect required={false} name={`combinedPerfume${id}`} products={rows.filter((row) => row.active)} placeholder="Pesquisar perfume..." />
                      <input name={`combinedPerfumeQuantity${id}`} aria-label="Quantidade" type="number" min="1" defaultValue="1" required className="h-12 w-24 rounded-2xl border border-[color:var(--line)] px-3" />
                    </SaleLine>
                  ))}
                  <AddLineButton onClick={() => setPerfumeLineIds((current) => [...current, Math.max(...current) + 1])}>Adicionar outro perfume</AddLineButton>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-4">
                <h3 className="font-serif text-2xl text-[color:var(--ink)]">Decants</h3>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {(["NONE", "KIT", "INDIVIDUAL"] as const).map((mode) => (
                    <button key={mode} type="button" onClick={() => setCombinedDecantMode(mode)} className={`rounded-xl px-2 py-3 text-sm font-semibold ${combinedDecantMode === mode ? "bg-white text-[color:var(--ink)] shadow-sm" : "text-slate-500"}`}>{mode === "NONE" ? "Sem decants" : mode === "KIT" ? "Kit 16,50 €" : "Individuais"}</button>
                  ))}
                </div>
                {combinedDecantMode === "KIT" ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-slate-600">Selecione os 5 perfumes diferentes do kit.</p>
                    <Field label="Quantidade de kits">
                      <input name="combinedKitQuantity" type="number" min="1" defaultValue="1" required className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4" />
                    </Field>
                    {[1, 2, 3, 4, 5].map((position) => <Field key={position} label={`Decant ${position}`}><SearchableProductSelect name={`combinedKit${position}`} products={rows.filter((row) => row.active && row.availableInFiveMl)} placeholder="Pesquisar perfume..." /></Field>)}
                  </div>
                ) : null}
                {combinedDecantMode === "INDIVIDUAL" ? (
                  <div className="mt-4 space-y-3">
                    {decantLineIds.map((id, index) => (
                      <SaleLine key={id} label={`Decant ${index + 1}`} onRemove={decantLineIds.length > 1 ? () => setDecantLineIds((current) => current.filter((lineId) => lineId !== id)) : undefined}>
                        <SearchableProductSelect name={`combinedDecant${id}`} products={rows.filter((row) => row.active && (row.availableInFiveMl || row.availableInTenMl))} placeholder="Pesquisar perfume..." />
                        <select name={`combinedDecantSize${id}`} defaultValue="5" className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-3"><option value="5">5 ml · 3,50 € / 4,50 €</option><option value="10">10 ml · 6,50 € / 7,50 €</option></select>
                        <input name={`combinedDecantQuantity${id}`} aria-label="Quantidade" type="number" min="1" defaultValue="1" className="h-12 w-24 rounded-2xl border border-[color:var(--line)] px-3" />
                      </SaleLine>
                    ))}
                    <AddLineButton onClick={() => setDecantLineIds((current) => [...current, Math.max(...current) + 1])}>Adicionar outro decant</AddLineButton>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex justify-end border-t border-[color:var(--line)] pt-5"><button disabled={savingCombinedSale} className="rounded-full bg-[color:var(--atlantic)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{savingCombinedSale ? "A registar..." : "Registar venda completa"}</button></div>
          </form>
        </section>
      ) : null}

      {activeView === "SALES" ? (
        <section className="rounded-[1.8rem] border border-[color:var(--line)] bg-white p-4 shadow-sm sm:p-7">
          <h2 className="font-serif text-3xl text-[color:var(--ink)]">Estado das vendas</h2>
          {salesLoading ? <p className="mt-6 text-slate-500">A carregar vendas...</p> : (
            <div className="mt-5 space-y-4">
              <div className="hidden flex-wrap gap-2 md:flex">
                {([
                  ["TODAY", "Hoje"],
                  ["7D", "7 dias"],
                  ["MONTH", "Este mês"],
                  ["CUSTOM", "Personalizado"],
                ] as const).map(([period, label]) => (
                  <button key={period} type="button" onClick={() => applySalesPeriod(period)} aria-pressed={salesPeriod === period} className={`rounded-full border px-4 py-2 text-sm font-medium ${salesPeriod === period ? "border-[color:var(--atlantic)] bg-[color:var(--atlantic)] text-white" : "border-[color:var(--line)] bg-white text-[color:var(--ink)]"}`}>{label}</button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <SalesMetricCard label="Total vendido" value={formatPrice(periodPaidValue + periodPendingValue)} />
                <SalesMetricCard label="Por receber" value={formatPrice(periodPendingValue)} active={salesStatusFilter === StockSaleStatus.PENDING} onClick={() => { setSalesStatusFilter((current) => current === StockSaleStatus.PENDING ? "ALL" : StockSaleStatus.PENDING); setSalesPage(1); }} />
                <SalesMetricCard label="Total de vendas" value={String(periodSales.length)} />
                <SalesMetricCard label="Por entregar" value={String(periodSales.filter((sale) => sale.deliveryStatus === StockDeliveryStatus.PENDING).length)} active={salesDeliveryFilter === StockDeliveryStatus.PENDING} onClick={() => { setSalesDeliveryFilter((current) => current === StockDeliveryStatus.PENDING ? "ALL" : StockDeliveryStatus.PENDING); setSalesPage(1); }} />
              </div>

              <div className="rounded-2xl border border-[color:var(--line)] bg-white p-3">
                <input value={salesQuery} onChange={(event) => { setSalesQuery(event.target.value); setSalesPage(1); }} placeholder="Pesquisar cliente ou produto" className="h-11 w-full rounded-xl border border-[color:var(--line)] px-3" />
                <div className="mt-2 grid grid-cols-2 gap-2 md:hidden">
                  <select aria-label="Período" value={salesPeriod} onChange={(event) => applySalesPeriod(event.target.value as typeof salesPeriod)} className="h-11 min-w-0 rounded-xl border border-[color:var(--line)] bg-white px-3"><option value="ALL">Todas</option><option value="TODAY">Hoje</option><option value="7D">Últimos 7 dias</option><option value="MONTH">Este mês</option><option value="CUSTOM">Personalizado</option></select>
                  <button type="button" onClick={() => setMobileFiltersOpen((open) => !open)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[color:var(--line)] px-3 text-sm"><Filter className="h-4 w-4" />Filtros{activeSalesFilterCount ? ` (${activeSalesFilterCount})` : ""}</button>
                </div>
                <div className={`mt-3 gap-2 ${mobileFiltersOpen ? "grid" : "hidden"} md:grid md:grid-cols-2 xl:grid-cols-6`}>
                  <select value={salesStatusFilter} onChange={(event) => { setSalesStatusFilter(event.target.value as "ALL" | StockSaleStatus); setSalesPage(1); }} className="h-11 rounded-xl border border-[color:var(--line)] bg-white px-3"><option value="ALL">Todos os pagamentos</option><option value={StockSaleStatus.PENDING}>Por pagar</option><option value={StockSaleStatus.PAID}>Pago</option><option value={StockSaleStatus.OFFERED}>Oferecido</option></select>
                  <select value={salesDeliveryFilter} onChange={(event) => { setSalesDeliveryFilter(event.target.value as "ALL" | StockDeliveryStatus); setSalesPage(1); }} className="h-11 rounded-xl border border-[color:var(--line)] bg-white px-3"><option value="ALL">Todas as entregas</option><option value={StockDeliveryStatus.PENDING}>Por entregar</option><option value={StockDeliveryStatus.DELIVERED}>Entregue</option></select>
                  <select value={salesKindFilter} onChange={(event) => { setSalesKindFilter(event.target.value as typeof salesKindFilter); setSalesPage(1); }} className="h-11 rounded-xl border border-[color:var(--line)] bg-white px-3"><option value="ALL">Todos os formatos</option><option value="BOTTLE">Frascos</option><option value="DECANT_5">Decants 5 ml</option><option value="DECANT_10">Decants 10 ml</option><option value="KIT">Kits</option></select>
                  <label className="flex h-11 items-center gap-2 rounded-xl border border-[color:var(--line)] px-3 text-sm"><input type="checkbox" checked={salesPendingOnly} onChange={(event) => { setSalesPendingOnly(event.target.checked); setSalesPage(1); }} /> Apenas pendentes</label>
                  <label className="text-xs text-slate-500">Desde<input type="date" value={salesFrom} onChange={(event) => { setSalesFrom(event.target.value); setSalesPeriod("CUSTOM"); setSalesPage(1); }} className="mt-1 h-10 w-full rounded-xl border border-[color:var(--line)] px-2" /></label>
                  <label className="text-xs text-slate-500">Até<input type="date" value={salesTo} onChange={(event) => { setSalesTo(event.target.value); setSalesPeriod("CUSTOM"); setSalesPage(1); }} className="mt-1 h-10 w-full rounded-xl border border-[color:var(--line)] px-2" /></label>
                  <button type="button" onClick={clearSalesFilters} className="h-10 self-end rounded-xl border border-[color:var(--line)] px-3 text-sm">Limpar filtros</button>
                </div>
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-[color:var(--line)] md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[color:var(--sand-soft)] text-left text-xs uppercase tracking-[0.14em] text-slate-500"><tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Artigos</th><th className="px-4 py-3">Pagamento</th><th className="px-4 py-3">Entrega</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
                    <tbody>
                      {pagedSales.map((sale) => <SaleTableRows key={sale.id} sale={sale} expanded={expandedSaleId === sale.id} onToggle={() => setExpandedSaleId((current) => current === sale.id ? null : sale.id)} onCustomerHistory={() => setCustomerHistoryName(sale.customerName)} onStatusChange={(status) => updateSaleStatus(sale.id, status)} onDeliveryStatusChange={(status) => updateDeliveryStatus(sale.id, status)} onSave={(event) => saveSaleEdits(event, sale)} onDelete={() => deleteSale(sale)} saving={savingSaleId === sale.id} deleting={deletingSaleId === sale.id} products={rows.filter((row) => row.active)} />)}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3 md:hidden">
                {pagedSales.map((sale) => <MobileSaleCard key={sale.id} sale={sale} expanded={expandedSaleId === sale.id} onToggle={() => setExpandedSaleId((current) => current === sale.id ? null : sale.id)} onCustomerHistory={() => setCustomerHistoryName(sale.customerName)} onStatusChange={(status) => updateSaleStatus(sale.id, status)} onDeliveryStatusChange={(status) => updateDeliveryStatus(sale.id, status)} paymentUpdating={updatingSaleFields.includes(`${sale.id}:payment`)} deliveryUpdating={updatingSaleFields.includes(`${sale.id}:delivery`)} onSave={(event) => saveSaleEdits(event, sale)} onDelete={() => deleteSale(sale)} saving={savingSaleId === sale.id} deleting={deletingSaleId === sale.id} products={rows.filter((row) => row.active)} />)}
              </div>

              {!pagedSales.length ? <p className="rounded-2xl border border-[color:var(--line)] p-5 text-slate-500">Nenhuma venda encontrada.</p> : null}
              <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--line)] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span>Página {salesPage} de {salesTotalPages} · {filteredSales.length} venda(s)</span><div className="flex gap-2"><button type="button" disabled={salesPage === 1} onClick={() => setSalesPage((page) => Math.max(1, page - 1))} className="rounded-full border px-3 py-2 disabled:opacity-40">Anterior</button><button type="button" disabled={salesPage === salesTotalPages} onClick={() => setSalesPage((page) => Math.min(salesTotalPages, page + 1))} className="rounded-full border px-3 py-2 disabled:opacity-40">Seguinte</button></div></div>
            </div>
          )}
        </section>
      ) : null}

      {customerHistoryName ? (
        <ModalFrame title={`Histórico de ${customerHistoryName}`} onClose={() => setCustomerHistoryName(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Histórico agrupado pelo nome guardado nas vendas. Pessoas com nomes iguais podem aparecer juntas.</p>
            <div className="grid grid-cols-2 gap-3">
              <SalesMetricCard label="Compras registadas" value={String(customerHistory.length)} />
              <SalesMetricCard label="Total gasto" value={formatPrice(customerHistory.reduce((total, sale) => total + sale.items.filter((item) => item.status !== StockSaleStatus.OFFERED).reduce((subtotal, item) => subtotal + item.unitPriceInCents * item.quantity, 0), 0))} />
            </div>
            <button type="button" onClick={() => { setNewSaleCustomerName(customerHistoryName); setCustomerHistoryName(null); setActiveView("NEW_SALE"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="w-full rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white">Nova venda para este cliente</button>
            <div className="space-y-2">
              {customerHistory.map((sale) => <div key={sale.id} className="rounded-2xl border border-[color:var(--line)] p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-[color:var(--ink)]">{new Date(sale.createdAt).toLocaleDateString("pt-PT")}</p><p className="mt-1 text-sm text-slate-500">{formatSaleSummary(sale)}</p>{sale.saleOrigin ? <p className="mt-1 text-xs text-slate-400">Origem: {sale.saleOrigin}</p> : null}</div><strong className="whitespace-nowrap">{formatPrice(sale.totalInCents)}</strong></div></div>)}
            </div>
          </div>
        </ModalFrame>
      ) : null}

      {activeView === "DECANTS" ? (
        <section className="mx-auto w-full max-w-4xl rounded-[1.8rem] border border-[color:var(--line)] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-5 font-serif text-3xl text-[color:var(--ink)]">Venda de decants</h2>
          <form className="space-y-4" onSubmit={submitDecantSale}>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[color:var(--sand-soft)] p-1">
              <button type="button" onClick={() => setDecantMode("KIT")} className={`rounded-xl px-3 py-3 text-sm font-semibold ${decantMode === "KIT" ? "bg-white text-[color:var(--ink)] shadow-sm" : "text-slate-500"}`}>Kit · 5 × 5 ml · 16,50 €</button>
              <button type="button" onClick={() => setDecantMode("INDIVIDUAL")} className={`rounded-xl px-3 py-3 text-sm font-semibold ${decantMode === "INDIVIDUAL" ? "bg-white text-[color:var(--ink)] shadow-sm" : "text-slate-500"}`}>Venda individual</button>
            </div>
            <Field label="Cliente">
              <input name="customerName" list="decant-customer-names" required minLength={2} className="h-12 w-full rounded-2xl border border-[color:var(--line)] px-4" placeholder="Nome da pessoa que compra" />
            </Field>
            <datalist id="decant-customer-names">{customerNames.map((name) => <option key={name} value={name} />)}</datalist>
            {decantMode === "KIT" ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Escolha 5 perfumes diferentes. Cada perfume terá uma saída registada a 3,30 €, totalizando 16,50 €.</p>
                {[1, 2, 3, 4, 5].map((position) => (
                  <Field key={position} label={`Perfume ${position}`}>
                    <SearchableProductSelect
                      name={`product${position}`}
                      products={rows.filter((row) => row.active && row.availableInFiveMl)}
                      placeholder={`Pesquisar perfume ${position}...`}
                    />
                  </Field>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {decantLineIds.map((id, index) => (
                  <SaleLine key={id} label={`Decant ${index + 1}`} onRemove={decantLineIds.length > 1 ? () => setDecantLineIds((current) => current.filter((lineId) => lineId !== id)) : undefined}>
                    <SearchableProductSelect name={`decantProduct${id}`} products={rows.filter((row) => row.active && (row.availableInFiveMl || row.availableInTenMl))} placeholder="Pesquisar perfume..." />
                    <select name={`decantSize${id}`} required defaultValue="5" className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-3">
                      <option value="5">5 ml · 3,50 € / 4,50 €</option><option value="10">10 ml · 6,50 € / 7,50 €</option>
                    </select>
                    <input name={`decantQuantity${id}`} aria-label="Quantidade" type="number" min="1" defaultValue="1" required className="h-12 w-24 rounded-2xl border border-[color:var(--line)] px-3" />
                  </SaleLine>
                ))}
                <AddLineButton onClick={() => setDecantLineIds((current) => [...current, Math.max(...current) + 1])}>Adicionar outro decant</AddLineButton>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[color:var(--line)] pt-4">
              <strong>{decantMode === "KIT" ? "Total: 16,50 €" : "Preço calculado pelo valor atual de cada frasco"}</strong>
              <button disabled={savingDecantSale} className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{savingDecantSale ? "A registar..." : "Registar venda"}</button>
            </div>
          </form>
        </section>
      ) : null}

      {activeView === "PERFUMES" ? (
        <section className="mx-auto w-full max-w-4xl rounded-[1.8rem] border border-[color:var(--line)] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-5 font-serif text-3xl text-[color:var(--ink)]">Venda de perfumes</h2>
          <form className="space-y-4" onSubmit={submitPerfumeSale}>
            <Field label="Cliente"><input name="customerName" list="perfume-customer-names" required minLength={2} className="h-12 w-full rounded-2xl border border-[color:var(--line)] px-4" placeholder="Nome da pessoa que compra" /></Field>
            <datalist id="perfume-customer-names">{customerNames.map((name) => <option key={name} value={name} />)}</datalist>
            <div className="space-y-3">
              {perfumeLineIds.map((id, index) => (
                <SaleLine key={id} label={`Perfume ${index + 1}`} onRemove={perfumeLineIds.length > 1 ? () => setPerfumeLineIds((current) => current.filter((lineId) => lineId !== id)) : undefined}>
                  <SearchableProductSelect name={`perfumeProduct${id}`} products={rows.filter((row) => row.active)} placeholder="Pesquisar perfume..." />
                  <input name={`perfumeQuantity${id}`} aria-label="Quantidade" type="number" min="1" defaultValue="1" required className="h-12 w-24 rounded-2xl border border-[color:var(--line)] px-3" />
                </SaleLine>
              ))}
              <AddLineButton onClick={() => setPerfumeLineIds((current) => [...current, Math.max(...current) + 1])}>Adicionar outro perfume</AddLineButton>
            </div>
            <div className="flex justify-end border-t border-[color:var(--line)] pt-4"><button disabled={savingPerfumeSale} className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{savingPerfumeSale ? "A registar..." : "Registar venda"}</button></div>
          </form>
        </section>
      ) : null}

      {showImportPanel ? (
        <ModalFrame title="Pré-visualização da importação Excel" onClose={() => setShowImportPanel(false)}>
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
                    <th className="px-3 py-3">Alterações</th>
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
                          <span className="text-slate-400">Sem alterações</span>
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
                Confirmar importação
              </button>
            </div>
          </div>
        </ModalFrame>
      ) : null}
    </div>
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
  return <InventoryDialog title={title} onClose={onClose}>{children}</InventoryDialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function SalesMetricCard({ label, value, active = false, onClick }: { label: string; value: string; active?: boolean; onClick?: () => void }) {
  const content = <><span className={`text-xs ${active ? "text-white/80" : "text-slate-500"}`}>{label}</span><strong className="mt-1 block font-serif text-xl">{value}</strong></>;
  const className = `rounded-2xl border p-3 text-left transition ${active ? "border-[color:var(--atlantic)] bg-[color:var(--atlantic)] text-white shadow-sm" : "border-[color:var(--line)] bg-[color:var(--sand-soft)] text-[color:var(--ink)]"}`;
  return onClick ? <button type="button" onClick={onClick} aria-pressed={active} className={className}>{content}</button> : <div className={className}>{content}</div>;
}

function MobileSaleCard({ sale, expanded, onToggle, onCustomerHistory, onStatusChange, onDeliveryStatusChange, paymentUpdating, deliveryUpdating, onSave, onDelete, saving, deleting, products }: {
  sale: StockSaleRow;
  expanded: boolean;
  onToggle: () => void;
  onCustomerHistory: () => void;
  onStatusChange: (status: StockSaleStatus) => void;
  onDeliveryStatusChange: (status: StockDeliveryStatus) => void;
  paymentUpdating: boolean;
  deliveryUpdating: boolean;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
  products: AdminStockRow[];
}) {
  const firstKitItemId = sale.items.find((item) => item.notes?.includes("Kit de decants"))?.id;
  return <article className={`min-w-0 overflow-hidden rounded-2xl border border-[color:var(--line)] ${sale.status === StockSaleStatus.PENDING || sale.deliveryStatus === StockDeliveryStatus.PENDING ? "bg-amber-50" : "bg-white"}`}>
    <div role="button" tabIndex={0} onClick={onToggle} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(); } }} className="cursor-pointer space-y-2.5 p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0"><button type="button" onClick={(event) => { event.stopPropagation(); onCustomerHistory(); }} className="max-w-full truncate text-left font-semibold text-[color:var(--ink)] underline decoration-[color:var(--line)] underline-offset-4">{sale.customerName}</button><p className="mt-1 text-xs text-slate-500">{new Date(sale.createdAt).toLocaleDateString("pt-PT")}{sale.saleOrigin ? ` · ${sale.saleOrigin}` : ""}</p></div>
        <strong className="shrink-0 font-serif text-lg">{formatPrice(sale.totalInCents)}</strong>
      </div>
      <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-slate-600">{formatCompactSaleSummary(sale)}</p>
      <div className="flex min-w-0 items-center gap-1 text-xs">
        <button type="button" disabled={paymentUpdating || sale.status === StockSaleStatus.OFFERED} aria-label={sale.status === StockSaleStatus.PAID ? "Marcar como por pagar" : "Marcar como pago"} onClick={(event) => { event.stopPropagation(); onStatusChange(sale.status === StockSaleStatus.PAID ? StockSaleStatus.PENDING : StockSaleStatus.PAID); }} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 font-semibold disabled:opacity-60 ${sale.status === StockSaleStatus.PAID ? "bg-emerald-50 text-emerald-800" : sale.status === StockSaleStatus.PENDING ? "bg-amber-100/70 text-amber-900" : "bg-slate-100 text-slate-600"}`}><span aria-hidden="true" className={`h-2 w-2 rounded-full ${sale.status === StockSaleStatus.PAID ? "bg-emerald-500" : sale.status === StockSaleStatus.PENDING ? "bg-amber-500" : "bg-slate-400"}`} />{paymentUpdating ? "A guardar…" : sale.status === StockSaleStatus.PAID ? "Pago" : sale.status === StockSaleStatus.PENDING ? "Por pagar" : "Oferecido"}</button>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <button type="button" disabled={deliveryUpdating} aria-label={sale.deliveryStatus === StockDeliveryStatus.DELIVERED ? "Marcar como por entregar" : "Marcar como entregue"} onClick={(event) => { event.stopPropagation(); onDeliveryStatusChange(sale.deliveryStatus === StockDeliveryStatus.DELIVERED ? StockDeliveryStatus.PENDING : StockDeliveryStatus.DELIVERED); }} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 font-semibold disabled:opacity-60 ${sale.deliveryStatus === StockDeliveryStatus.DELIVERED ? "bg-emerald-50 text-emerald-800" : "bg-amber-100/70 text-amber-900"}`}><span aria-hidden="true" className={`h-2 w-2 rounded-full ${sale.deliveryStatus === StockDeliveryStatus.DELIVERED ? "bg-emerald-500" : "bg-amber-500"}`} />{deliveryUpdating ? "A guardar…" : sale.deliveryStatus === StockDeliveryStatus.DELIVERED ? "Entregue" : "Por entregar"}</button>
        <span aria-hidden="true" className={`ml-auto text-xl leading-none text-slate-400 transition ${expanded ? "rotate-90" : ""}`}>›</span>
      </div>
    </div>
    {expanded ? <form onSubmit={onSave} className="space-y-4 border-t border-[color:var(--line)] bg-[color:var(--sand-soft)] p-4">
      <Field label="Nome do cliente"><input name="customerName" defaultValue={sale.customerName} required minLength={2} className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4" /></Field>
      <Field label="Origem da venda"><select name="saleOrigin" defaultValue={sale.saleOrigin ?? ""} className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4"><option value="">Não indicada</option>{SALE_ORIGINS.map((origin) => <option key={origin} value={origin}>{origin}</option>)}</select></Field>
      {sale.items.map((item) => <div key={item.id} className="space-y-3 rounded-2xl border border-[color:var(--line)] bg-white p-3">
        <p className="text-sm font-medium">{item.quantity}× {item.name}</p>
        <Field label="Produto"><SearchableProductSelect name={`saleItem${item.id}`} products={products} placeholder="Pesquisar produto..." initialProductId={item.productId} /></Field>
        {item.notes?.includes("Decant individual") ? <Field label="Tamanho"><select name={`saleItemSize${item.id}`} defaultValue={item.sizeMl ?? 5} className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4"><option value="5">5 ml</option><option value="10">10 ml</option></select></Field> : null}
        {!item.notes?.includes("Kit de decants") || item.id === firstKitItemId ? <div className="grid grid-cols-2 gap-2"><Field label="Pagamento"><select name={item.notes?.includes("Kit de decants") ? "kitStatus" : `saleItemStatus${item.id}`} defaultValue={item.status} className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-2"><option value={StockSaleStatus.PAID}>Pago</option><option value={StockSaleStatus.PENDING}>Por pagar</option><option value={StockSaleStatus.OFFERED}>Oferecido</option></select></Field><Field label="Entrega"><select name={item.notes?.includes("Kit de decants") ? "kitDelivery" : `saleItemDelivery${item.id}`} defaultValue={item.deliveryStatus} className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-2"><option value={StockDeliveryStatus.DELIVERED}>Entregue</option><option value={StockDeliveryStatus.PENDING}>Por entregar</option></select></Field></div> : null}
      </div>)}
      <div className="grid gap-2"><button disabled={saving || deleting} className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "A guardar..." : "Guardar alterações"}</button><button type="button" onClick={onDelete} disabled={saving || deleting} className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 disabled:opacity-50">{deleting ? "A eliminar..." : "Eliminar venda"}</button></div>
    </form> : null}
  </article>;
}

function SaleTableRows({
  sale,
  expanded,
  onToggle,
  onCustomerHistory,
  onStatusChange,
  onDeliveryStatusChange,
  onSave,
  onDelete,
  saving,
  deleting,
  products,
  showSummary = true,
}: {
  sale: StockSaleRow;
  expanded: boolean;
  onToggle: () => void;
  onCustomerHistory: () => void;
  onStatusChange: (status: StockSaleStatus) => void;
  onDeliveryStatusChange: (status: StockDeliveryStatus) => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
  products: AdminStockRow[];
  showSummary?: boolean;
}) {
  const firstKitItemId = sale.items.find((item) => item.notes?.includes("Kit de decants"))?.id;
  return (
    <>
      {showSummary ? <tr onClick={onToggle} className={`cursor-pointer border-t border-[color:var(--line)] hover:bg-[color:var(--sand-soft)] ${sale.status === StockSaleStatus.PENDING ? "bg-amber-50" : "bg-white"}`}>
        <td className="whitespace-nowrap px-4 py-3 font-medium text-[color:var(--ink)]"><button type="button" onClick={(event) => { event.stopPropagation(); onCustomerHistory(); }} className="underline decoration-[color:var(--line)] underline-offset-4">{sale.customerName}</button></td>
        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(sale.createdAt).toLocaleDateString("pt-PT")}</td>
        <td className="max-w-md truncate px-4 py-3 text-slate-500">{formatSaleSummary(sale)}</td>
        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
          <select value={sale.status} onChange={(event) => onStatusChange(event.target.value as StockSaleStatus)} className="h-9 rounded-xl border border-[color:var(--line)] bg-white px-2"><option value={StockSaleStatus.PENDING}>Por pagar</option><option value={StockSaleStatus.PAID}>Pago</option><option value={StockSaleStatus.OFFERED}>Oferecido</option></select>
        </td>
        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
          <select value={sale.deliveryStatus} onChange={(event) => onDeliveryStatusChange(event.target.value as StockDeliveryStatus)} className="h-9 rounded-xl border border-[color:var(--line)] bg-white px-2"><option value={StockDeliveryStatus.DELIVERED}>Entregue</option><option value={StockDeliveryStatus.PENDING}>Por entregar</option></select>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{formatPrice(sale.totalInCents)}</td>
      </tr> : null}
      {expanded ? (
        <tr className="border-t border-[color:var(--line)] bg-[color:var(--sand-soft)]">
          <td colSpan={6} className="p-4">
            <form onSubmit={onSave} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nome do cliente"><input name="customerName" defaultValue={sale.customerName} required minLength={2} className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4" /></Field>
                <Field label="Origem da venda"><select name="saleOrigin" defaultValue={sale.saleOrigin ?? ""} className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4"><option value="">Não indicada</option>{SALE_ORIGINS.map((origin) => <option key={origin} value={origin}>{origin}</option>)}</select></Field>
              </div>
              <div className="space-y-3">
                {sale.items.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-[color:var(--line)] bg-white p-3">
                    <p className="mb-3 text-sm font-medium text-[color:var(--ink)]">{`${item.notes?.includes("Kit de decants") ? "Perfume do kit · 5 ml" : item.notes?.includes("Decant individual") ? `Decant ${index + 1} · ${item.sizeMl ?? 5} ml` : `Perfume ${index + 1}`} · ${item.quantity} unidade${item.quantity === 1 ? "" : "s"}`}</p>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                      <Field label="Produto"><SearchableProductSelect name={`saleItem${item.id}`} products={products} placeholder="Pesquisar produto..." initialProductId={item.productId} /></Field>
                      {item.notes?.includes("Decant individual") ? <Field label="Tamanho"><select name={`saleItemSize${item.id}`} defaultValue={item.sizeMl ?? 5} className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-4"><option value="5">5 ml · 3,50 € / 4,50 €</option><option value="10">10 ml · 6,50 € / 7,50 €</option></select></Field> : null}
                      {!item.notes?.includes("Kit de decants") || item.id === firstKitItemId ? <>
                        <Field label="Pagamento"><select name={item.notes?.includes("Kit de decants") ? "kitStatus" : `saleItemStatus${item.id}`} defaultValue={item.status} className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-4"><option value={StockSaleStatus.PAID}>Pago</option><option value={StockSaleStatus.PENDING}>Por pagar</option><option value={StockSaleStatus.OFFERED}>Oferecido</option></select></Field>
                        <Field label="Entrega"><select name={item.notes?.includes("Kit de decants") ? "kitDelivery" : `saleItemDelivery${item.id}`} defaultValue={item.deliveryStatus} className="h-12 rounded-2xl border border-[color:var(--line)] bg-white px-4"><option value={StockDeliveryStatus.DELIVERED}>Entregue</option><option value={StockDeliveryStatus.PENDING}>Por entregar</option></select></Field>
                      </> : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={onDelete} disabled={saving || deleting} className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"><Trash2 className="h-4 w-4" />{deleting ? "A eliminar..." : "Eliminar venda"}</button>
                <button disabled={saving || deleting} className="rounded-full bg-[color:var(--atlantic)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "A guardar..." : "Guardar alterações"}</button>
              </div>
            </form>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function SearchableProductSelect({
  name,
  products,
  placeholder,
  required = true,
  initialProductId = "",
}: {
  name: string;
  products: AdminStockRow[];
  placeholder: string;
  required?: boolean;
  initialProductId?: string;
}) {
  const initialProduct = products.find((product) => product.id === initialProductId);
  const [query, setQuery] = useState(initialProduct ? `${initialProduct.name} · ${initialProduct.brandName}` : "");
  const listboxId = useId();
  const [selectedId, setSelectedId] = useState(initialProductId);
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const normalizedQuery = normalizeStockSearch(query);
    const ordered = [...products].sort((left, right) =>
      left.name.localeCompare(right.name, "pt-PT"),
    );
    if (!normalizedQuery) return ordered.slice(0, 30);
    return ordered.filter((product) =>
      normalizeStockSearch(`${product.name} ${product.brandName}`).includes(normalizedQuery),
    ).slice(0, 30);
  }, [products, query]);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selectedId} />
      <input
        value={query}
        required={required}
        autoComplete="off"
        placeholder={placeholder}
        aria-label={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedId("");
          setOpen(true);
        }}
        className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 pr-10 text-[color:var(--ink)]"
      />
      <Search className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-slate-400" />
      {open ? (
        <div id={listboxId} role="listbox" className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-[color:var(--line)] bg-white p-2 shadow-xl">
          {matches.length ? matches.map((product) => (
            <button
              key={product.id}
              type="button"
              role="option"
              aria-selected={selectedId === product.id}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                setSelectedId(product.id);
                setQuery(`${product.name} · ${product.brandName}`);
                setOpen(false);
              }}
              className="block w-full rounded-xl px-3 py-3 text-left text-sm text-[color:var(--ink)] hover:bg-[color:var(--sand-soft)]"
            >
              <span className="font-medium">{product.name}</span>
              <span className="ml-1 text-slate-500">· {product.brandName}</span>
            </button>
          )) : (
            <p className="px-3 py-4 text-sm text-slate-500">Nenhum perfume encontrado.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SaleLine({ label, children, onRemove }: { label: string; children: React.ReactNode; onRemove?: () => void }) {
  return <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--sand-soft)] p-3">
    <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-[color:var(--ink)]">{label}</span>{onRemove ? <button type="button" onClick={onRemove} className="text-xs font-medium text-rose-600">Remover</button> : null}</div>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start [&>div]:min-w-0 [&>div]:flex-1">{children}</div>
  </div>;
}

function AddLineButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--ink)]"><Plus className="h-4 w-4" />{children}</button>;
}

function getItemStatusTotal(sales: StockSaleRow[], status: StockSaleStatus) {
  return sales.reduce((salesTotal, sale) => salesTotal + sale.items.reduce(
    (itemTotal, item) => itemTotal + (item.status === status ? item.quantity * item.unitPriceInCents : 0),
    0,
  ), 0);
}

function formatSaleSummary(sale: StockSaleRow) {
  const regularItems = sale.items.filter((item) => !item.notes?.includes("Kit de decants"));
  const kitDecantUnits = sale.items
    .filter((item) => item.notes?.includes("Kit de decants"))
    .reduce((total, item) => total + item.quantity, 0);
  const summary = regularItems.map((item) => `${item.quantity}× ${item.name}`);
  if (kitDecantUnits) summary.push(`${Math.max(1, Math.floor(kitDecantUnits / 5))}× Kit de decants`);
  return summary.join(", ");
}

function formatCompactSaleSummary(sale: StockSaleRow) {
  const items = formatSaleSummary(sale).split(", ").filter(Boolean);
  if (items.length <= 2) return items.join(" · ");
  return `${items.slice(0, 2).join(" · ")} · +${items.length - 2} artigos`;
}

function getModalTitle(
  kind: "ENTRY" | "SALE" | "ADJUSTMENT" | "HISTORY" | "NOTES",
  productName: string,
) {
  switch (kind) {
    case "ENTRY":
      return `Entrada de stock · ${productName}`;
    case "SALE":
      return `Saída de stock · ${productName}`;
    case "ADJUSTMENT":
      return `Ajuste manual · ${productName}`;
    case "HISTORY":
      return `Histórico · ${productName}`;
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
    customerSales: payload.type === StockMovementType.SALE && payload.customerName.trim()
      ? [
          ...row.customerSales.filter((sale) => sale.customerName !== payload.customerName.trim()),
          {
            customerName: payload.customerName.trim(),
            quantity: getStockOutputs(row, payload.customerName.trim()) + payload.quantity,
          },
        ]
      : row.customerSales,
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
