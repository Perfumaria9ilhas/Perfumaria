import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { homepageEditorSchema } from "@/lib/homepage-config";
import { isEligibleDailyPerfume } from "@/lib/daily-perfume";

const changeSchema = z.discriminatedUnion("action", [
  z.object({action:z.literal("daily"),productId:z.string().min(1).nullable(),version:z.string().datetime()}).strict(),
  z.object({action:z.literal("editor"),editor:homepageEditorSchema,version:z.string().datetime()}).strict(),
]);
export async function PATCH(request: Request) {
  if (!await getCurrentAdmin()) return NextResponse.json({error:"Sessão expirada."},{status:401});
  const origin=request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({error:"Origem inválida."},{status:403});
  let raw: unknown;
  try { raw=await request.json(); } catch { return NextResponse.json({error:"Pedido inválido."},{status:400}); }
  const parsed=changeSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({error:"Verifique os campos e os destinos dos links."},{status:400});
  const change=parsed.data;
  if (change.action==="daily" && change.productId) {
    const product=await prisma.product.findUnique({where:{id:change.productId},select:{active:true,category:{select:{slug:true}},productType:{select:{slug:true}}}});
    if (!product || !isEligibleDailyPerfume(product)) return NextResponse.json({error:"Selecione um perfume ativo."},{status:400});
  }
  const result=await prisma.$transaction(async(tx)=>{
    const current=await tx.storeSettings.findUnique({where:{id:"main"},select:{homepageConfig:true,updatedAt:true}});
    if (!current || current.updatedAt.toISOString()!==change.version) return null;
    const stored=current.homepageConfig && typeof current.homepageConfig==="object" && !Array.isArray(current.homepageConfig) ? current.homepageConfig : {};
    const config={...stored,...(change.action==="daily"?{perfumeOfDayId:change.productId}:{editor:change.editor})};
    const written=await tx.storeSettings.updateMany({where:{id:"main",updatedAt:current.updatedAt},data:{homepageConfig:config as Prisma.InputJsonValue}});
    if (!written.count) return null;
    return tx.storeSettings.findUniqueOrThrow({where:{id:"main"},select:{updatedAt:true}});
  });
  if (!result) return NextResponse.json({error:"A configuração mudou noutra página. Atualize antes de guardar."},{status:409});
  revalidatePath("/", "layout"); revalidatePath("/admin"); revalidatePath("/admin/loja");
  return NextResponse.json({version:result.updatedAt.toISOString()});
}
