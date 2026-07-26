import { AdminShell } from "@/components/admin/admin-shell";
import { StockAdminTable } from "@/components/admin/stock-admin-table";
import { requireAdmin } from "@/lib/auth";
import { getAdminStockTableData } from "@/lib/stock-server";

export default async function AdminStockPage() {
  await requireAdmin();
  const data = await getAdminStockTableData();

  return (
    <AdminShell
      title="Stock"
      description="Tabela interna para gerir custos, quantidades, alertas, historico e importacao/exportacao Excel."
    >
      <StockAdminTable
        rows={data.rows}
        brands={data.brands}
        categories={data.categories}
        customerNames={data.customerNames}
        customerSummaries={data.customerSummaries}
      />
    </AdminShell>
  );
}
