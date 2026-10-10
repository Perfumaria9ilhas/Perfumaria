import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
import {build} from 'esbuild';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const schema=new URL(process.env.DATABASE_URL).searchParams.get('schema');
assert.match(schema??'',/^account_test_\d+$/,'Refuse mutation outside isolated test schema');
process.env.ADMIN_EMAIL='principal@example.invalid';process.env.ADMIN_PASSWORD='Principal-test-only';process.env.ADMIN_SESSION_SECRET='isolated-account-test-signing-key-2026';
const p=new PrismaClient();globalThis.__accountsPrisma=p;globalThis.__accountCookies=new Map();
const plugin={name:'test-boundaries',setup(b){
 b.onResolve({filter:/^@\/lib\/prisma$/},()=>({path:'prisma',namespace:'test'}));
 b.onResolve({filter:/^next\/(headers|navigation|cache)$/},a=>({path:a.path,namespace:'test'}));
 b.onResolve({filter:/^next\/server$/},()=>({path:'next/server.js',external:true}));
 b.onLoad({filter:/.*/,namespace:'test'},a=>({loader:'js',contents:a.path==='prisma'?'export const prisma=globalThis.__accountsPrisma;':a.path.endsWith('headers')?'export async function cookies(){return {get:k=>globalThis.__accountCookies.has(k)?{value:globalThis.__accountCookies.get(k)}:undefined,set:(k,v)=>globalThis.__accountCookies.set(k,v),delete:k=>globalThis.__accountCookies.delete(k)}}':a.path.endsWith('navigation')?'export function redirect(path){throw new Error("REDIRECT:"+path)}':'export function revalidatePath(){};export function unstable_noStore(){}'}));
 b.onResolve({filter:/^@\//},a=>({path:resolve('src',a.path.slice(2)+'.ts')}));
}};
const entries={auth:'src/lib/auth.ts',rules:'src/lib/promotions.ts',manage:'src/lib/promotion-management.ts',api:'src/app/api/admin/promotions/route.ts',favorites:'src/app/api/account/favorites/route.ts',profile:'src/app/api/account/profile/route.ts',orders:'src/app/api/orders/route.ts',prices:'src/app/api/cart-prices/route.ts',catalog:'src/lib/data.ts',decants:'src/lib/product-sizes.ts'};
for(const [key,entry] of Object.entries(entries))await build({entryPoints:[entry],outfile:`.codex-dev/promo-test-${key}.mjs`,bundle:true,platform:'node',format:'esm',packages:'external',plugins:[plugin]});
const mods=Object.fromEntries(await Promise.all(Object.keys(entries).map(async k=>[k,await import(pathToFileURL(resolve(`.codex-dev/promo-test-${k}.mjs`)).href)])));
const {auth,rules,api,favorites,profile,orders,prices,catalog,decants}=mods;
const req=(body,path='/api/admin/promotions',origin='http://localhost:3000')=>new Request('http://localhost:3000'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
try {
 await p.productPromotion.deleteMany(); // This script refuses every non-test schema above.
 assert.equal(rules.azoresDateTime(rules.parseAzoresDateTime('2026-01-15T12:30')),'2026-01-15T12:30');
 assert.equal(rules.parseAzoresDateTime('2026-01-15T12:30').toISOString(),'2026-01-15T13:30:00.000Z');
 assert.equal(rules.parseAzoresDateTime('2026-07-15T12:30').toISOString(),'2026-07-15T12:30:00.000Z');
 assert.throws(()=>rules.parseAzoresDateTime('2026-03-29T00:30'));
 assert.equal(rules.parseAzoresDateTime('2026-10-25T00:30').toISOString(),'2026-10-25T00:30:00.000Z');
 assert.throws(()=>rules.parseAzoresDateTime('2026-02-31T10:00'));
 assert.equal(rules.promotionPrice(4500,'PERCENT',2000),3600);assert.equal(rules.promotionPrice(4500,'FIXED',4500),null);
 assert.equal(rules.promotionPrice(4500,'FIXED',-1),null);assert.equal(rules.promotionPrice(1,'PERCENT',9999),null);
 assert.equal((await api.GET()).status,401);
 await auth.createCustomerSession({sub:'test-customer',email:'test-customer@example.invalid',firstName:'Test',lastName:'Only'});
 assert.equal((await api.POST(req({}))).status,401);
 const customerCookie=globalThis.__accountCookies.get('nineilhas_customer_session');globalThis.__accountCookies.clear();
 await auth.createSession({sub:'test-admin',email:'test-admin@example.invalid',name:'Test'});
 assert.equal((await api.GET()).status,200);
 assert.equal((await api.POST(req({},undefined,'https://evil.invalid'))).status,403);
 const adminCookie=globalThis.__accountCookies.get('nineilhas_admin_session');
 const eligible=(await p.product.findMany({where:{active:true},include:{brand:true,category:true,productType:true}})).filter(rules.eligiblePromotion).slice(0,3);assert(eligible.length===3);
 const [one,two]=eligible;
 // Synthetic changes only, copied catalogue in the isolated schema.
 await p.product.update({where:{id:one.id},data:{salePriceInCents:null,stock:20}});
 await p.storeSettings.update({where:{id:'main'},data:{homepageConfig:{perfumeOfDayId:one.id}}});
 const basic={productIds:[one.id],method:'PERCENT',amount:'20',immediate:true,startsAt:'',endsAt:''};
 let response=await api.POST(req(basic));assert.equal(response.status,200,await response.text());
 assert.equal((await api.POST(req(basic))).status,409);
 assert.equal((await api.POST(req({...basic,productIds:[two.id],amount:'100'}))).status,409);
 assert.equal(await p.productPromotion.count({where:{productId:two.id}}),0);
 const atomic=await api.POST(req({...basic,productIds:[two.id,'zz-missing-product']}));assert.equal(atomic.status,409);assert.equal(await p.productPromotion.count({where:{productId:two.id}}),0);
 async function edit(action,data){const row=await p.productPromotion.findUniqueOrThrow({where:{productId:one.id}});const r=await api.PATCH(req({id:row.id,version:row.updatedAt.toISOString(),action,...(data?{data}:{})}));assert.equal(r.status,200,await r.text());return row;}
 const rule=await p.productPromotion.findUniqueOrThrow({where:{productId:one.id}});
 const priced=rules.applyProductPromotion(one,one.id,rule);assert.equal(priced.salePriceInCents,Math.round(one.priceInCents*.8));assert.equal(priced.decantBottlePriceInCents,one.salePriceInCents??one.priceInCents);assert.equal(priced.dailyDiscountApplied,false);
 assert.equal(rules.applyProductPromotion({...one,salePriceInCents:null},one.id,{...rule,value:500}).salePriceInCents,Math.floor((one.priceInCents*90+50)/100));
 const tied=rules.applyProductPromotion({...one,salePriceInCents:null},one.id,{...rule,value:1000});assert.equal(tied.perfumeOfDay,true);assert.equal(tied.dailyDiscountApplied,true);
 const publicOne=(await catalog.getCatalogData()).products.find(p=>p.id===one.id);assert.equal(publicOne.salePriceInCents,Math.round(one.priceInCents*.8));assert(!('promotion' in publicOne));
 response=await prices.POST(req({items:[{id:'b',productId:one.id,variant:'bottle'},{id:'d',productId:one.id,variant:'5ml'}]},'/api/cart-prices'));const cart=(await response.json()).items;assert.equal(cart[0].priceInCents,publicOne.salePriceInCents);assert.equal(cart[1].priceInCents,decants.getDecantPriceInCents(one.priceInCents,'5ml'));
 response=await orders.POST(req({items:[{productId:one.id,variant:'bottle',quantity:1}]},'/api/orders'));assert.equal(response.status,200);const whatsapp=decodeURIComponent(new URL((await response.json()).whatsappUrl).searchParams.get('text'));assert(whatsapp.includes(new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(publicOne.salePriceInCents/100)));
 const stale=await edit('DISABLE');assert.equal(rules.applyProductPromotion({...one,salePriceInCents:null},null,await p.productPromotion.findUnique({where:{productId:one.id}})).salePriceInCents,null);
 assert.equal((await api.PATCH(req({id:stale.id,version:stale.updatedAt.toISOString(),action:'ENABLE'}))).status,409);
 await edit('ENABLE');await edit('END');assert.equal((await p.productPromotion.findUnique({where:{productId:one.id}})).status,'ENDED');
 const tomorrow=new Date(Date.now()+86400000);await edit('EDIT',{...basic,productIds:undefined,method:'FIXED',amount:(one.priceInCents*.7/100).toFixed(2),immediate:false,startsAt:rules.azoresDateTime(tomorrow),endsAt:rules.azoresDateTime(new Date(tomorrow.getTime()+86400000))});await edit('ENABLE');
 const scheduled=await p.productPromotion.findUniqueOrThrow({where:{productId:one.id}});assert.equal(rules.promotionState(scheduled),'SCHEDULED');assert.equal(rules.promotionState(scheduled,new Date(scheduled.endsAt.getTime()+1)),'EXPIRED');
 assert.equal(rules.applyProductPromotion({...one,salePriceInCents:null},null,scheduled,new Date(scheduled.endsAt.getTime()+1)).salePriceInCents,null);
 assert.equal(rules.applyProductPromotion({...one,active:false},null,rule).salePriceInCents,one.salePriceInCents);
 assert.equal(rules.applyProductPromotion({...one,productType:{slug:'gift-set'}},null,rule).salePriceInCents,one.salePriceInCents);
 const audit=await p.promotionAudit.findFirstOrThrow();await assert.rejects(p.promotionAudit.delete({where:{id:audit.id}}));
 assert.equal((await api.PATCH(req({id:scheduled.id,version:scheduled.updatedAt.toISOString(),action:'DELETE'}))).status,409);
 assert.equal((await api.PATCH(req({id:scheduled.id,version:scheduled.updatedAt.toISOString(),action:'DELETE',confirmation:'ELIMINAR'}))).status,200);assert.equal(await p.productPromotion.count(),0);assert(await p.promotionAudit.count()>5);
 // Leave an actual active promotion and one scheduled rule for browser validation.
 await api.POST(req(basic));await api.POST(req({...basic,productIds:[two.id],immediate:false,startsAt:rules.azoresDateTime(tomorrow)}));
 globalThis.__accountCookies.clear();globalThis.__accountCookies.set('nineilhas_customer_session',customerCookie);
 assert.equal((await favorites.POST(req({ids:[one.id,one.id,two.id]},'/api/account/favorites'))).status,200);assert.equal(await p.customerFavorite.count({where:{customerId:'test-customer'}}),2);
 assert.equal((await favorites.PUT(req({productId:one.id,selected:false},'/api/account/favorites'))).status,200);assert.equal(await p.customerFavorite.count(),1);
 assert.equal((await favorites.PUT(req({productId:one.id,selected:true},'/api/account/favorites','https://evil.invalid'))).status,403);
 response=await profile.PATCH(req({action:'PROFILE',firstName:'Teste',lastName:'Isolado',phone:'000000000',address:'Morada de teste isolado'},'/api/account/profile'));assert.equal(response.status,200);
 const customer=await p.customerAccount.findUniqueOrThrow({where:{id:'test-customer'}});assert.equal(customer.role,'CUSTOMER');assert.equal(customer.active,true);
 assert.equal((await profile.PATCH(req({action:'PASSWORD',currentPassword:'bad',password:'New-test-password',confirmation:'New-test-password'},'/api/account/profile'))).status,400);
 assert.equal((await profile.PATCH(req({action:'PASSWORD',currentPassword:'Isolated-test-password-2026',password:'New-test-password',confirmation:'New-test-password'},'/api/account/profile'))).status,200);
 assert(await auth.validateCustomerCredentials(customer.email,'New-test-password'));
 // Restore synthetic login used by browser tests. No production identities involved.
 const {hash}=await import('bcryptjs');await p.customerAccount.update({where:{id:customer.id},data:{passwordHash:await hash('Isolated-test-password-2026',10)}});
 globalThis.__accountCookies.clear();globalThis.__accountCookies.set('nineilhas_admin_session',adminCookie);assert.equal((await api.GET()).status,200);
 console.log('PASS real PostgreSQL promotion lifecycle/audit/concurrency, customer denial and admin access, exact Azores DST times, independent minimum price/daily tie, catalogue/cart/WhatsApp parity, decant reference preservation, inactive/expired rules, persisted favourites, profile validation and password change. All mutations isolated.');
}finally{await p.$disconnect();}
