import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { eligiblePromotion, parseAzoresDateTime, promotionPrice, promotionState } from "@/lib/promotions";

const fields = {
  method: z.enum(["PERCENT", "FIXED"]),
  amount: z.string().trim().regex(/^\d{1,7}([.,]\d{1,2})?$/),
  startsAt: z.string().max(16), endsAt: z.string().max(16), immediate: z.boolean(),
};
export const createPromotionSchema = z.object({ productIds: z.array(z.string().min(1).max(100)).min(1).max(50), ...fields }).strict();
export const editPromotionSchema = z.object({ id: z.string().min(1).max(100), version: z.string().datetime(), action: z.enum(["EDIT", "ENABLE", "DISABLE", "END", "DELETE"]), confirmation: z.string().optional(), data: z.object(fields).strict().optional() }).strict();
type Fields = z.infer<typeof createPromotionSchema>;
function ruleData(input: Omit<Fields, "productIds">, now: Date) {
  const value = Math.round(Number(input.amount.replace(",", ".")) * 100);
  const startsAt = input.immediate ? now : parseAzoresDateTime(input.startsAt);
  const endsAt = input.endsAt ? parseAzoresDateTime(input.endsAt) : null;
  if (endsAt && (endsAt <= startsAt || endsAt <= now)) throw new Error("O fim deve ser posterior ao início e ao momento atual.");
  return { method: input.method, value, startsAt, endsAt };
}
const relations = { brand: true, category: true, productType: true } as const;
export async function listPromotions() {
  const now = new Date();
  const [promotions, products] = await Promise.all([
    prisma.productPromotion.findMany({ include: { product: { include: relations } }, orderBy: { updatedAt: "desc" } }),
    prisma.product.findMany({ where: { active: true }, include: relations, orderBy: { name: "asc" } }),
  ]);
  const productDto = (p: typeof products[number]) => ({ id: p.id, name: p.name, brand: p.brand.name, imageUrl: p.imageUrl, sizeLabel: p.sizeLabel, base: p.priceInCents, active: p.active });
  return { products: products.filter(eligiblePromotion).map(productDto), promotions: promotions.map(({ product, ...p }) => ({ ...p, startsAt: p.startsAt.toISOString(), endsAt: p.endsAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(), state: promotionState(p, now), price: eligiblePromotion(product) ? promotionPrice(product.priceInCents, p.method, p.value) : null, product: productDto(product) })) };
}
export async function createPromotions(actorId: string, input: z.infer<typeof createPromotionSchema>) {
  const now = new Date(); const data = ruleData(input, now);
  const ids = [...new Set(input.productIds)].sort();
  await prisma.$transaction(async tx => {
    for (const id of ids) {
      await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id" = ${id} FOR UPDATE`;
      const product = await tx.product.findUnique({ where: { id }, include: relations });
      if (!product || !eligiblePromotion(product) || promotionPrice(product.priceInCents, data.method, data.value) === null) throw new Error("Selecione frascos ativos com um preço promocional positivo e inferior ao preço base.");
      if (await tx.productPromotion.findUnique({ where: { productId: id } })) throw new Error(`Já existe uma promoção para ${product.name}. Edite o registo existente.`);
      const promotion = await tx.productPromotion.create({ data: { ...data, productId: id, actorId } });
      await tx.promotionAudit.create({ data: { promotionId: promotion.id, productId: id, actorId, action: "CREATE", next: JSON.parse(JSON.stringify(promotion)) } });
    }
  }, { timeout: 30000 });
}
export async function changePromotion(actorId: string, input: z.infer<typeof editPromotionSchema>) {
  await prisma.$transaction(async tx => {
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
        if (input.action === "ENABLE" && current.endsAt && current.endsAt <= new Date()) throw new Error("Edite as datas antes de ativar uma promoção terminada.");
      }
      const status = input.action === "ENABLE" ? "ENABLED" : input.action === "DISABLE" ? "DISABLED" : input.action === "END" ? "ENDED" : current.status;
      const changed = await tx.productPromotion.update({ where: { id: input.id }, data: { ...data, status, actorId } });
      next = JSON.parse(JSON.stringify(changed));
    }
    await tx.promotionAudit.create({ data: { promotionId: input.id, productId: current.productId, actorId, action: input.action, previous: JSON.parse(JSON.stringify(before)), ...(next ? { next } : {}) } });
  }, { timeout: 30000 });
}
