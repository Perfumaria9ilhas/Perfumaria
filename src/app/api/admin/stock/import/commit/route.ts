import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { applyStockImportWorkbook } from "@/lib/stock-server";

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      {
        error: "Selecione um ficheiro Excel valido.",
      },
      { status: 400 },
    );
  }

  const parsed = await applyStockImportWorkbook(file);

  if (parsed.hasErrors) {
    return NextResponse.json(parsed, { status: 400 });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/stock");

  return NextResponse.json({
    ...parsed,
    success: true,
  });
}

