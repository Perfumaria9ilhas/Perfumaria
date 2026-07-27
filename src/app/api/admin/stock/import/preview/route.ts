import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseStockImportWorkbook } from "@/lib/stock-server";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      {
        error: "Selecione um ficheiro Excel válido.",
      },
      { status: 400 },
    );
  }

  const parsed = await parseStockImportWorkbook(file);
  return NextResponse.json(parsed);
}

