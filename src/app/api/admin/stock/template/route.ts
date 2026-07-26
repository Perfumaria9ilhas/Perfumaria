import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createStockImportTemplateBuffer } from "@/lib/stock-server";

export async function GET() {
  await requireAdmin();

  const buffer = await createStockImportTemplateBuffer();

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="modelo-stock-perfumaria-9-ilhas.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
