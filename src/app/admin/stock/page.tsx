import { AdminShell } from "@/components/admin/admin-shell";
import { StockAdminTable } from "@/components/admin/stock-admin-table";
import { requireAdmin } from "@/lib/auth";
import { getAdminStockTableData } from "@/lib/stock-server";

export default async function AdminStockPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const initialView = params.view === "sales" ? "SALES" : params.view === "stock" ? "STOCK" : "NEW_SALE";
  const data = await getAdminStockTableData();

  return (
    <AdminShell
      title="Stock"
      description="Tabela interna para gerir custos, quantidades, alertas, historico e importacao/exportacao Excel."
    >
      <StockAdminTable
        key={initialView}
        initialView={initialView}
        rows={data.rows}
        brands={data.brands}
        categories={data.categories}
        customerNames={data.customerNames}
        customerSummaries={data.customerSummaries}
      />
    </AdminShell>
  );
}
