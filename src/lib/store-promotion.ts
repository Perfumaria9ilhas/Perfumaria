import { prisma } from "./prisma";
import type { PrismaClient } from "@prisma/client";
import { promotionSelect } from "./promotion-select";
export function getStorePromotion(db: Pick<PrismaClient,"storePromotion"> = prisma) {
  return db.storePromotion.findUnique({where:{id:"main"},...promotionSelect});
}
