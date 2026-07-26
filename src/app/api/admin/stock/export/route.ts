import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createStockWorkbookBuffer, getFilteredStockExportData } from "@/lib/stock-server";
import { parseStockFilters } from "@/lib/stock";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const scope = request.nextUrl.searchParams.get("scope");
  const filters = parseStockFilters(request.nextUrl.searchParams);
  const includeAll = scope === "all";
  const data = await getFilteredStockExportData(filters, includeAll);
  const buffer = createStockWorkbookBuffer(data.rows, data.movements);
  const today = new Date().toISOString().slice(0, 10);

  revalidatePath("/admin/stock");

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="stock-perfumaria-9-ilhas-${today}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
