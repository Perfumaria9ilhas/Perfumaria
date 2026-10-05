import { AdminShell } from "@/components/admin/admin-shell";
import { StockAdminTable } from "@/components/admin/stock-admin-table";
import { requireAdmin } from "@/lib/auth";
import { getAdminStockTableData } from "@/lib/stock-server";

export default async function AdminStockPage({ searchParams }: { searchParams: Promise<{ view?: string; payment?: string; delivery?: string; period?: string; status?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const initialView = params.view === "new-sale" ? "NEW_SALE" : params.view === "sales" ? "SALES" : "STOCK";
  const title = initialView === "NEW_SALE" ? "Nova venda" : initialView === "SALES" ? "Estado das vendas" : "Stock";
  const description = initialView === "NEW_SALE" ? "Registar uma nova venda." : initialView === "SALES" ? "Ver, filtrar e atualizar o estado das vendas." : "Gerir produtos, quantidades e inventário.";
  const data = await getAdminStockTableData();

  return (
    <AdminShell
      title={title}
      description={description}
    >
      <StockAdminTable
        key={initialView}
        initialView={initialView}
        initialSalesStatus={params.payment === "pending" ? "PENDING" : "ALL"}
        initialDeliveryStatus={params.delivery === "pending" ? "PENDING" : "ALL"}
        initialSalesPeriod={params.period === "all" ? "ALL" : "MONTH"}
        initialStockStatus={params.status === "low" ? "LOW" : "all"}
        rows={data.rows}
        brands={data.brands}
        categories={data.categories}
        customerNames={data.customerNames}
        customerSummaries={data.customerSummaries}
      />
    </AdminShell>
  );
}
