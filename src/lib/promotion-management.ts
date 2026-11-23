import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getDecantPriceInCents } from "./product-sizes";
import { getSalePriceInCents } from "./format";
import { readHomepageState } from "./homepage-config";
import { applyProductPromotion } from "./promotions";
import { prisma } from "@/lib/prisma";
import { eligiblePromotion, parseAzoresDateTime, promotionPrice, promotionState } from "@/lib/promotions";

const fields = {
  method: z.enum(["PERCENT", "FIXED", "AMOUNT"]),
  amount: z.string().trim().regex(/^\d{1,7}([.,]\d{1,2})?$/),
  includeVariants: z.boolean().default(false),
  startsAt: z.string().max(16), endsAt: z.string().max(16), immediate: z.boolean(),
};
export const createPromotionSchema = z.object({ productIds: z.array(z.string().min(1).max(100)).min(1).max(500), versions: z.record(z.string(), z.string().datetime()).optional(), ...fields }).strict();
export const editPromotionSchema = z.object({ id: z.string().min(1).max(100), version: z.string().datetime(), action: z.enum(["EDIT", "ENABLE", "DISABLE", "END", "DELETE"]), confirmation: z.string().optional(), data: z.object(fields).strict().optional() }).strict();
type Fields = z.infer<typeof createPromotionSchema>;
function validateVariantPrices(product: {name:string;priceInCents:number;salePriceInCents:number|null;availableInFiveMl:boolean;availableInTenMl:boolean}, rule: {method:"PERCENT"|"FIXED"|"AMOUNT";value:number;includeVariants?:boolean}) {
  const prices = [{name:"produto",price:product.priceInCents},...(rule.includeVariants ? [
    ...(product.availableInFiveMl ? [{name:"5 ml",price:getDecantPriceInCents(getSalePriceInCents(product),"5ml")}] : []),
    ...(product.availableInTenMl ? [{name:"10 ml",price:getDecantPriceInCents(getSalePriceInCents(product),"10ml")}] : [])] : [])];
  for(const variant of prices) if(promotionPrice(variant.price,rule.method,rule.value)===null) throw new Error(`${product.name} (${variant.name}): o desconto deve deixar um preço positivo, inferior ao preço normal.`);
}

export const storePromotionSchema = z.object({scope:z.literal("STORE"),version:z.string().datetime().nullable(),action:z.enum(["EDIT","ENABLE","DISABLE","END"]),data:z.object({...fields,method:z.enum(["PERCENT","AMOUNT"])}).strict().optional()}).strict();
export async function changeStorePromotion(actorId:string,input:z.infer<typeof storePromotionSchema>) {
  await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('promotion-configuration',0))`;
    const current=await tx.storePromotion.findUnique({where:{id:"main"}});
    if((current?.updatedAt.toISOString()??null)!==input.version) throw new Error("O desconto geral foi alterado por outro administrador. Atualize a lista.");
    const data=input.action==="EDIT"&&input.data?ruleData({...input.data,includeVariants:true},new Date()):null;
    if(input.action==="EDIT"&&!data || !current&&!data) throw new Error("Dados do desconto geral em falta.");
    if(input.action==="EDIT"||input.action==="ENABLE") {
      const candidate=data??current!;
      if(candidate.endsAt&&candidate.endsAt<=new Date())throw new Error("Edite as datas antes de ativar um desconto terminado.");
      await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "active" = true ORDER BY "id" FOR UPDATE`;
      const products=await tx.product.findMany({where:{active:true}});
      for(const product of products)validateVariantPrices(product,{...candidate,includeVariants:true});
      if(promotionPrice(1650,candidate.method,candidate.value)===null)throw new Error("O desconto é inválido para o kit de cinco decants.");
    }
    const status=input.action==="DISABLE"?"DISABLED":input.action==="END"?"ENDED":"ENABLED";
    const values=data?{method:data.method,value:data.value,startsAt:data.startsAt,endsAt:data.endsAt,status:status as "ENABLED",actorId}:{status:status as "ENABLED",actorId};
    const changed=current?await tx.storePromotion.update({where:{id:"main"},data:values}):await tx.storePromotion.create({data:{id:"main",method:data!.method,value:data!.value,startsAt:data!.startsAt,endsAt:data!.endsAt,status,actorId}});
    await tx.promotionAudit.create({data:{promotionId:"store:main",productId:"*",actorId,action:`STORE_${input.action}`,...(current?{previous:JSON.parse(JSON.stringify(current))}:{}),next:JSON.parse(JSON.stringify(changed))}});
  },{maxWait:10000,timeout:60000});
}
function ruleData(input: Omit<Fields, "productIds" | "versions">, now: Date) {
  const value = Math.round(Number(input.amount.replace(",", ".")) * 100);
  const startsAt = input.immediate ? now : parseAzoresDateTime(input.startsAt);
  const endsAt = input.endsAt ? parseAzoresDateTime(input.endsAt) : null;
  if (endsAt && (endsAt <= startsAt || endsAt <= now)) throw new Error("O fim deve ser posterior ao início e ao momento atual.");
  return { method: input.method, value, startsAt, endsAt, includeVariants: input.includeVariants };
}
const relations = { brand: true, category: true, productType: true } as const;
export async function listPromotions() {
  const now = new Date();
  const [promotions, products, storePromotion, settings] = await Promise.all([
    prisma.productPromotion.findMany({ include: { product: { include: relations } }, orderBy: { updatedAt: "desc" } }),
    prisma.product.findMany({ where: { active: true }, include: relations, orderBy: { name: "asc" } }),
    prisma.storePromotion.findUnique({where:{id:"main"}}),
    prisma.storeSettings.findUnique({where:{id:"main"},select:{homepageConfig:true}}),
  ]);
    // Prices are resolved below using the same rules as the public catalogue.
  const dailyId = readHomepageState(settings?.homepageConfig).perfumeOfDayId;
  const productDto = (p: typeof products[number]) => ({ id: p.id, name: p.name, brand: p.brand.name, imageUrl: p.imageUrl, sizeLabel: p.sizeLabel, base: p.priceInCents, active: p.active,
    salePriceInCents: p.salePriceInCents, availableInFiveMl:p.availableInFiveMl, availableInTenMl:p.availableInTenMl, category:p.category, productType:p.productType,
    fiveBase:getDecantPriceInCents(getSalePriceInCents(p),"5ml"),tenBase:getDecantPriceInCents(getSalePriceInCents(p),"10ml") });
  const serialize = <T extends {startsAt:Date;endsAt:Date|null;createdAt:Date;updatedAt:Date}>(p:T) => ({...p,startsAt:p.startsAt.toISOString(),endsAt:p.endsAt?.toISOString()??null,createdAt:p.createdAt.toISOString(),updatedAt:p.updatedAt.toISOString(),state:promotionState(p as T & Parameters<typeof promotionState>[0],now)});
  return { asOf:now.toISOString(), dailyId, products: products.filter(eligiblePromotion).map(productDto),
    storePromotion:storePromotion?serialize(storePromotion):null,
    promotions:promotions.map(({product,...p})=>({...serialize(p),actualPrice:getSalePriceInCents(applyProductPromotion(product,dailyId,p,now,storePromotion)),price:eligiblePromotion(product)?promotionPrice(product.priceInCents,p.method,p.value):null,product:productDto(product)})) };

}
export async function createPromotions(actorId: string, input: z.infer<typeof createPromotionSchema>) {
  const now = new Date(); const data = ruleData(input, now);
  const ids = [...new Set(input.productIds)].sort();
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('promotion-configuration',0))`;
    await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id" = ANY(${ids}::text[]) ORDER BY "id" FOR UPDATE`;
    const products=await tx.product.findMany({where:{id:{in:ids}},include:relations});
    if(products.length!==ids.length)throw new Error("Um dos produtos j\u00e1 n\u00e3o existe. Atualize a lista.");
    const previous=await tx.productPromotion.findMany({where:{productId:{in:ids}}});
    const before=new Map(previous.map(p=>[p.productId,p]));
    for(const product of products) {
      if(!eligiblePromotion(product))throw new Error(`${product.name} n\u00e3o est\u00e1 ativo.`);
      validateVariantPrices(product,data);
      const old=before.get(product.id);
      if(old&&input.versions?.[product.id]!==old.updatedAt.toISOString()||!old&&input.versions?.[product.id])throw new Error(`A promo\u00e7\u00e3o de ${product.name} mudou. Atualize a lista antes de guardar.`);
    }
    const newIds=ids.filter(id=>!before.has(id));
    if(newIds.length)await tx.productPromotion.createMany({data:newIds.map(productId=>({...data,productId,actorId}))});
    if(previous.length)await tx.productPromotion.updateMany({where:{productId:{in:previous.map(p=>p.productId)}},data:{...data,status:"ENABLED",actorId}});
    const changed=await tx.productPromotion.findMany({where:{productId:{in:ids}}});
    await tx.promotionAudit.createMany({data:changed.map(p=>({promotionId:p.id,productId:p.productId,actorId,action:before.has(p.productId)?"EDIT":"CREATE",...(before.has(p.productId)?{previous:JSON.parse(JSON.stringify(before.get(p.productId)))}:{}),next:JSON.parse(JSON.stringify(p))}))});
  }, { timeout: 30000 });
}
export async function changePromotion(actorId: string, input: z.infer<typeof editPromotionSchema>) {
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('promotion-configuration',0))`;
    const target = await tx.productPromotion.findUnique({ where: { id: input.id }, select: { productId: true } });
    if (!target) throw new Error("Promoção não encontrada.");
    await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id" = ${target.productId} FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "ProductPromotion" WHERE "id" = ${input.id} FOR UPDATE`;
    const current = await tx.productPromotion.findUnique({ where: { id: input.id }, include: { product: { include: relations } } });
    if (!current || current.updatedAt.toISOString() !== input.version) throw new Error("Esta promoção foi alterada. Atualize a lista antes de guardar.");
    const { product, ...before } = current;
    let next: Prisma.InputJsonValue | undefined;
    if (input.action === "DELETE") {
      if (input.confirmation !== "ELIMINAR") throw new Error("Confirme a eliminação da promoção.");
      await tx.productPromotion.delete({ where: { id: input.id } });
    } else {
      const data = input.action === "EDIT" ? input.data && ruleData(input.data, new Date()) : null;
      if (input.action === "EDIT" && !data) throw new Error("Dados em falta.");
      if (["EDIT", "ENABLE"].includes(input.action)) {
        const candidate = data ?? current;
        if (!eligiblePromotion(product) || promotionPrice(product.priceInCents, candidate.method, candidate.value) === null) throw new Error("O produto ou preço já não é elegível para este desconto.");
        validateVariantPrices(product,candidate);
        if (input.action === "ENABLE" && current.endsAt && current.endsAt <= new Date()) throw new Error("Edite as datas antes de ativar uma promoção terminada.");
      }
      const status = input.action === "ENABLE" ? "ENABLED" : input.action === "DISABLE" ? "DISABLED" : input.action === "END" ? "ENDED" : current.status;
      const changed = await tx.productPromotion.update({ where: { id: input.id }, data: { ...data, status, actorId } });
      next = JSON.parse(JSON.stringify(changed));
    }
    await tx.promotionAudit.create({ data: { promotionId: input.id, productId: current.productId, actorId, action: input.action, previous: JSON.parse(JSON.stringify(before)), ...(next ? { next } : {}) } });
  }, { timeout: 30000 });
}
