import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getCurrentAdmin } from "@/lib/auth";
import { isAccountRequestOriginAllowed } from "@/lib/account-request-origin";
import { changePromotion, createPromotionSchema, createPromotions, editPromotionSchema, listPromotions } from "@/lib/promotion-management";
const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
  if (!await getCurrentAdmin()) return NextResponse.json({ error: "Sem permissão." }, { status: 401, headers });
  return NextResponse.json(await listPromotions(), { headers });
}
async function mutate(request: Request, edit: boolean) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Sem permissão." }, { status: 401, headers });
  if (!isAccountRequestOriginAllowed(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403, headers });
  let json: unknown; try { json = await request.json(); } catch { return NextResponse.json({ error: "Pedido inválido." }, { status: 400, headers }); }
  try {
    if (edit) { const input = editPromotionSchema.safeParse(json); if (!input.success) throw new Error("Dados inválidos."); await changePromotion(admin.id, input.data); }
    else { const input = createPromotionSchema.safeParse(json); if (!input.success) throw new Error("Dados inválidos."); await createPromotions(admin.id, input.data); }
  } catch (error) {
    const message = error instanceof Prisma.PrismaClientKnownRequestError ? "Não foi possível guardar. Atualize a lista e tente novamente." : error instanceof Error ? error.message : "Não foi possível guardar.";
    return NextResponse.json({ error: message }, { status: 409, headers });
  }
  for (const path of ["/", "/catalogo", "/conta", "/admin/descontos"]) revalidatePath(path);
  return NextResponse.json(await listPromotions(), { headers });
}
export async function POST(request: Request) { return mutate(request, false); }
export async function PATCH(request: Request) { return mutate(request, true); }
