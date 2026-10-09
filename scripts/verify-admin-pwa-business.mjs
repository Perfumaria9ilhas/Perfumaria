import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
await mkdir('.codex-dev',{recursive:true});
import {build} from 'esbuild';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const products=Array.from({length:5},(_,i)=>({id:'test-'+i,name:'Isolated product '+i,active:true,stock:10,priceInCents:i===1?5500:4500,salePriceInCents:null,availableInFiveMl:true,availableInTenMl:true,sizeLabel:'100 ml',purchaseCostInCents:2000,lowStockAlert:3,stockNotes:null,updatedAt:new Date('2026-10-09T12:00:00Z')}));
let movements=[];
const tx={product:{findMany:async({where})=>products.filter(p=>where.id.in.includes(p.id)).map(p=>({...p})),updateMany:async({where,data})=>{const p=products.find(p=>p.id===where.id&&p.stock===where.stock);if(!p)return {count:0};if(where.updatedAt&&p.updatedAt.getTime()!==where.updatedAt.getTime())return {count:0};Object.assign(p,data,{updatedAt:new Date(p.updatedAt.getTime()+1000)});return {count:1};}},stockMovement:{create:async({data})=>{const row={id:'movement-'+movements.length,...data};movements.push(row);return row;},findMany:async({where})=>movements.filter(m=>where.OR.some(c=>c.saleGroupId===m.saleGroupId||c.id===m.id)).map(m=>({...m,product:products.find(p=>p.id===m.productId)})),update:async({where,data})=>{const m=movements.find(m=>m.id===where.id);for(const [k,v] of Object.entries(data))if(v!==undefined)m[k]=v;return m;}}};
tx.$queryRaw=async()=>[];
tx.product.findUnique=async({where})=>{const p=products.find(p=>p.id===where.id);return p ? {...p} : null;};
tx.product.findUniqueOrThrow=tx.product.findUnique;
tx.stockMovement.findFirst=async({where})=>movements.find(m=>m.productId===where.productId&&m.type===where.type)??null;
tx.product.update=async({where,data})=>Object.assign(products.find(p=>p.id===where.id),data);
globalThis.__isolatedAdminPrisma={product:tx.product,$transaction:async(fn)=>{const saved=structuredClone({products,movements});try{return await fn(tx);}catch(e){products.splice(0,products.length,...saved.products);movements=saved.movements;throw e;}}};
const plugin={name:'isolated-prisma',setup(b){b.onResolve({filter:/^next\/server\.js$/},()=>({path:'next/server.js',external:true}));b.onResolve({filter:/^next\/server$/},()=>({path:'next-server',namespace:'pwa-next'}));b.onLoad({filter:/.*/,namespace:'pwa-next'},()=>({contents:'export {NextResponse} from \"next/server.js\"; export function after(){}',loader:'js'}));b.onResolve({filter:/^(@\/lib\/(prisma|auth)|next\/cache)$/},a=>({path:a.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:a.path.endsWith('prisma')?'export const prisma=globalThis.__isolatedAdminPrisma;':a.path.endsWith('auth')?'export async function requireAdmin(){}':'export function revalidatePath(){}',loader:'js'}));b.onResolve({filter:/^@\//},a=>({path:resolve('src',a.path.slice(2)+'.ts')}));}};
for(const [name,source] of [['combined','src/app/api/admin/stock/sales/combined/route.ts'],['statuses','src/app/api/admin/stock/sales/route.ts'],['stock','src/app/api/admin/stock/product/[productId]/route.ts']])await build({entryPoints:[source],outfile:'.codex-dev/isolated-'+name+'.mjs',bundle:true,platform:'node',format:'esm',packages:'external',plugins:[plugin]});
const combined=await import(pathToFileURL(resolve('.codex-dev/isolated-combined.mjs')).href);const statuses=await import(pathToFileURL(resolve('.codex-dev/isolated-statuses.mjs')).href);
const request=(body)=>new Request('http://localhost/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const sale={customerName:'Isolated test customer',status:'PENDING',deliveryStatus:'PENDING',perfumeLines:[{productId:'test-0',quantity:2}],decantLines:[{productId:'test-0',sizeMl:5,quantity:1},{productId:'test-1',sizeMl:10,quantity:1}],kitProductIds:[],kitQuantity:1};
let response=await combined.POST(request(sale));assert.equal(response.status,200);assert.equal(products[0].stock,8);assert.equal(products[1].stock,10);assert.equal(movements.length,3);assert.equal(movements[1].saleUnitPriceInCents,350);assert.equal(movements[2].saleUnitPriceInCents,750);assert.equal(movements[1].unitCostInCents,100);assert.equal(movements[2].unitCostInCents,200);assert.equal(movements[0].previousStock,10);assert.equal(movements[0].resultingStock,8);
const id=movements[0].saleGroupId;for(const [payment,delivery] of [['PAID','DELIVERED'],['PENDING','PENDING']]){response=await statuses.PATCH(request({saleGroupId:id,status:payment,deliveryStatus:delivery}));assert.equal(response.status,200);assert(movements.filter(m=>m.type==='SALE').every(m=>m.saleStatus===payment&&m.deliveryStatus===delivery));assert.equal(products[0].stock,8);}
response=await combined.POST(request({...sale,perfumeLines:[{productId:'test-0',quantity:99}]}));assert.equal(response.status,400);assert.equal(products[0].stock,8);assert.equal(movements.filter(m=>m.type==='SALE').length,3);
response=await combined.POST(request({...sale,perfumeLines:[],decantLines:[],kitProductIds:products.map(p=>p.id)}));assert.equal(response.status,200);assert.equal(movements.filter(m=>m.type==='SALE').length,8);assert(movements.filter(m=>m.notes?.startsWith('Kit de decants')).every(m=>m.reason==='DECANT'&&m.saleUnitPriceInCents===330));assert.equal(products[0].stock,8);
console.log('PASS actual sale/status handlers with isolated in-memory Prisma: bottle stock decrement, decants without bottle decrement, kit, prices, payment/delivery transitions, insufficient-stock rollback. No real database writes.');

const stock=await import(pathToFileURL(resolve('.codex-dev/isolated-stock.mjs')).href);const context={params:Promise.resolve({productId:'test-0'})};
response=await stock.PATCH(request({stock:4,lowStockAlert:3,unitCost:'20,50',active:true}),context);assert.equal(response.status,200);assert.equal(products[0].stock,4);assert.equal(products[0].purchaseCostInCents,2050);assert.equal(movements.at(-1).resultingStock,4);assert.equal(movements.at(-1).previousStock,8);
const length=movements.length;response=await stock.PATCH(request({stock:4,lowStockAlert:3,unitCost:'20,50',active:true}),context);assert.equal((await response.json()).unchanged,true);assert.equal(movements.length,length);
response=await stock.PATCH(request({stock:-1,lowStockAlert:3}),context);assert.equal(response.status,400);assert.equal(products[0].stock,4);
console.log('PASS actual quick stock edit, purchase cost, adjustment history, unchanged-value idempotency and negative-stock validation in isolated persistence.');

const currentVersion=products[0].updatedAt.toISOString();
response=await stock.PATCH(request({stock:4,lowStockAlert:3,basePrice:'47',version:currentVersion}),context);assert.equal(response.status,200);assert.equal(products[0].priceInCents,4700);assert.equal(movements.at(-1).quantity,0);assert(movements.at(-1).notes.includes('anterior'));assert(movements.at(-1).notes.includes('novo'));
response=await stock.PATCH(request({stock:99,lowStockAlert:3,version:currentVersion}),context);assert.equal(response.status,409);assert.equal(products[0].stock,4);
response=await stock.PATCH(request({stock:4,lowStockAlert:3,sizeLabel:'50 ml',version:products[0].updatedAt.toISOString()}),context);assert.equal(response.status,409);assert.equal(products[0].sizeLabel,'100 ml');
const originalSales=movements.filter(m=>m.type==='SALE').length;
assert.equal(originalSales,8);assert(movements.filter(m=>m.notes?.startsWith('Estado da venda')).length>=6);
products.push({...products[4],id:'unsold',sizeLabel:'100 ml'});
response=await stock.PATCH(request({stock:3,lowStockAlert:3,sizeLabel:'50 ml',basePrice:'35',version:products.at(-1).updatedAt.toISOString()}),{params:Promise.resolve({productId:'unsold'})});assert.equal(response.status,200);assert.equal(products.at(-1).sizeLabel,'50 ml');assert.equal(products.at(-1).priceInCents,3500);
console.log('PASS capacity change on unsold product, protected historical bottle/decant capacity, stale-version conflict, price-only audit, status history.');

const recordedDecantPrice=movements.find(m=>m.type==='SALE'&&m.notes?.includes('Decant individual')&&m.productId==='test-0').saleUnitPriceInCents;
products[0].priceInCents=5500;products[0].active=false;products[0].availableInFiveMl=false;
response=await statuses.PATCH(request({saleGroupId:id,status:'PAID',deliveryStatus:'DELIVERED'}));assert.equal(response.status,200);
assert.equal(movements.find(m=>m.type==='SALE'&&m.notes?.includes('Decant individual')&&m.productId==='test-0').saleUnitPriceInCents,recordedDecantPrice);
console.log('PASS payment/delivery updates preserve historical decant prices and work for sold products subsequently deactivated.');

movements.push({...movements.find(m=>m.type==='SALE'),id:'gift-line',saleStatus:'OFFERED',quantity:1});
response=await statuses.PATCH(request({saleGroupId:id,status:'PENDING'}));assert.equal(response.status,200);assert.equal(movements.find(m=>m.id==='gift-line').saleStatus,'OFFERED');
console.log('PASS group payment updates preserve offered items in mixed sales.');

// The inline row uses this existing endpoint: one atomic save for capacity,
// current bottle price and quantity, without touching decants or purchase cost.
const inlineProduct=products.find(p=>p.id==='unsold');
const inlineCost=inlineProduct.purchaseCostInCents;
response=await stock.PATCH(request({stock:6,lowStockAlert:3,sizeLabel:'75 ml',basePrice:'39,50',version:inlineProduct.updatedAt.toISOString()}),{params:Promise.resolve({productId:'unsold'})});
assert.equal(response.status,200);assert.equal(inlineProduct.stock,6);assert.equal(inlineProduct.sizeLabel,'75 ml');assert.equal(inlineProduct.priceInCents,3950);assert.equal(inlineProduct.purchaseCostInCents,inlineCost);assert.equal(inlineProduct.availableInFiveMl,true);assert.equal(inlineProduct.availableInTenMl,true);
const inlineAudit=JSON.parse(movements.at(-1).notes.split(' · ')[1]);assert.equal(inlineAudit.anterior.stock,3);assert.equal(inlineAudit.novo.stock,6);assert.equal(inlineAudit.anterior.sizeLabel,'50 ml');assert.equal(inlineAudit.novo.sizeLabel,'75 ml');
const version=(await response.json()).version;assert.equal(version,inlineProduct.updatedAt.toISOString());
response=await stock.PATCH(request({stock:6,lowStockAlert:3,salePrice:'32,50',version}),{params:Promise.resolve({productId:'unsold'})});assert.equal(response.status,200);assert.equal(inlineProduct.priceInCents,3950);assert.equal(inlineProduct.salePriceInCents,3250);
console.log('PASS inline atomic capacity/price/quantity save, audit before/after, version refresh and separate promotional/base prices; decant availability and costs preserved.');
