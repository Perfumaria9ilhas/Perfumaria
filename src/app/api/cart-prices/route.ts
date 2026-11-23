import { getStorePromotion } from "@/lib/store-promotion";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSalePriceInCents } from "@/lib/format";
import { getDecantPriceInCents } from "@/lib/product-sizes";
import { resolveCatalogPrice, productPromotionSelect } from "@/lib/promotion-select";
import { readHomepageState } from "@/lib/homepage-config";
const schema=z.object({items:z.array(z.object({id:z.string().min(1).max(300),productId:z.string().min(1).max(100),variant:z.enum(["bottle","5ml","10ml"])}).strict()).max(50)}).strict();
export async function POST(request:Request) {
 let input:unknown;try{input=await request.json();}catch{return NextResponse.json({error:"Pedido inválido."},{status:400});}
 const parsed=schema.safeParse(input);if(!parsed.success)return NextResponse.json({error:"Pedido inválido."},{status:400});
 const [products,settings,storePromotion]=await Promise.all([prisma.product.findMany({where:{id:{in:parsed.data.items.map(i=>i.productId)}},select:{promotion:productPromotionSelect,id:true,sizeLabel:true,priceInCents:true,salePriceInCents:true,stock:true,active:true,availableInFiveMl:true,availableInTenMl:true,category:{select:{slug:true}},productType:{select:{slug:true}}}}),prisma.storeSettings.findUnique({where:{id:"main"},select:{homepageConfig:true}}),getStorePromotion()]);
 const dailyId=readHomepageState(settings?.homepageConfig).perfumeOfDayId;
 const pricingTime=new Date();
 return NextResponse.json({items:parsed.data.items.flatMap(item=>{const p=products.find(p=>p.id===item.productId);if(!p)return [{id:item.id,stock:0}];const available=p.active&&(item.variant==="bottle"||item.variant==="5ml"&&p.availableInFiveMl||item.variant==="10ml"&&p.availableInTenMl);const price=item.variant==="bottle"?getSalePriceInCents(resolveCatalogPrice(p,dailyId,pricingTime,storePromotion)):(item.variant==="5ml"?resolveCatalogPrice(p,dailyId,pricingTime,storePromotion).fiveMlPriceInCents:resolveCatalogPrice(p,dailyId,pricingTime,storePromotion).tenMlPriceInCents);return [{id:item.id,priceInCents:price,originalPriceInCents:item.variant==="bottle"?p.priceInCents:getDecantPriceInCents(getSalePriceInCents(p),item.variant),stock:available?p.stock:0}];})},{headers:{"Cache-Control":"no-store"}});
}
