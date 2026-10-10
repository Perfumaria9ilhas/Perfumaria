// Run only against an explicitly isolated, migrated PostgreSQL schema.
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const schema=new URL(process.env.DATABASE_URL).searchParams.get('schema');
assert.match(schema??'',/^account_test_\d+$/,'Refuse to test account mutations outside the isolated schema');
process.env.ADMIN_EMAIL='principal@example.invalid';process.env.ADMIN_PASSWORD='Principal-test-only';process.env.ADMIN_SESSION_SECRET='isolated-account-test-signing-key-2026';
const p=new PrismaClient();globalThis.__accountsPrisma=p;globalThis.__accountCookies=new Map();
const plugin={name:'account-test-boundaries',setup(b){
 b.onResolve({filter:/^@\/lib\/prisma$/},()=>({path:'prisma',namespace:'test'}));
 b.onResolve({filter:/^next\/(headers|navigation|cache)$/},a=>({path:a.path,namespace:'test'}));
 b.onResolve({filter:/^next\/server$/},()=>({path:'next/server.js',external:true}));
 b.onLoad({filter:/.*/,namespace:'test'},a=>({loader:'js',contents:a.path==='prisma'?'export const prisma=globalThis.__accountsPrisma;':a.path.endsWith('headers')?'export async function cookies(){return {get:k=>globalThis.__accountCookies.has(k)?{value:globalThis.__accountCookies.get(k)}:undefined,set:(k,v)=>globalThis.__accountCookies.set(k,v),delete:k=>globalThis.__accountCookies.delete(k)}}':a.path.endsWith('navigation')?'export function redirect(path){throw new Error("REDIRECT:"+path)}':'export function revalidatePath(){}'}));
 b.onResolve({filter:/^@\//},a=>({path:resolve('src',a.path.slice(2)+'.ts')}));
}};
await mkdir('.codex-dev',{recursive:true});
for(const [name,entry] of [['auth','src/lib/auth.ts'],['management','src/lib/account-management.ts'],['users','src/app/api/admin/users/route.ts'],['deletion','src/app/api/account/deletion/route.ts'],['promotions','src/lib/account-promotions.ts'],['daily','src/lib/daily-perfume.ts']])await build({entryPoints:[entry],outfile:`.codex-dev/account-test-${name}.mjs`,bundle:true,platform:'node',format:'esm',packages:'external',plugins:[plugin]});
const load=name=>import(pathToFileURL(resolve(`.codex-dev/account-test-${name}.mjs`)).href);
try {
 await p.$transaction(async tx=>{await tx.$queryRaw`SELECT set_config('nineilhas.account_actor', 'configured-admin', true)`;await tx.customerAccount.update({where:{id:'test-customer'},data:{active:true,role:'CUSTOMER',deletionRequestedAt:null,sessionVersion:{increment:1}}});}, {timeout:30000});
 const requestsBefore=await p.accountAudit.count({where:{targetId:'test-customer',action:'REQUEST_DELETION'}});
 const auth=await load('auth');const manager=await load('management');const users=await load('users');const deletion=await load('deletion');
 const {accountPromotions}=await load('promotions');const {applyDailyPerfume}=await load('daily');
 const promotion={id:'daily',priceInCents:4500,salePriceInCents:4000,category:{slug:'perfumes'},productType:{slug:'perfume'}};
 const day=applyDailyPerfume(promotion,'daily');assert.equal(day.salePriceInCents,4000);assert.equal(day.decantBottlePriceInCents,4000);
 assert.equal(accountPromotions([day,promotion,{...promotion,active:false},{...promotion,salePriceInCents:null},{...promotion,salePriceInCents:0},{...promotion,salePriceInCents:-1},{...promotion,salePriceInCents:5000}]).length,2);
 assert.equal(accountPromotions([applyDailyPerfume({...promotion,salePriceInCents:null},null)]).length,0);
 console.log('PASS valid active catalogue promotions, Perfume do Dia, no stacking, original decant pricing, disabled/cleared/invalid promotions excluded.');
 const request=(body,origin='http://localhost:3000')=>new Request('http://localhost:3000/api/admin/users',{method:'PATCH',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal(await auth.getCurrentAdmin(),null);assert.equal((await users.GET(new Request('http://localhost:3000/api/admin/users'))).status,401);
 const customer=await auth.validateCustomerCredentials('test-customer@example.invalid','Isolated-test-password-2026');assert(customer);assert.equal(customer.role,'CUSTOMER');
 await auth.createCustomerSession({sub:customer.id,email:customer.email,firstName:customer.firstName,lastName:customer.lastName});assert.equal((await auth.getCurrentCustomer()).id,customer.id);assert.equal(await auth.getCurrentAdmin(),null);
 assert.equal((await users.PATCH(request({}))).status,401);
 assert.equal((await deletion.POST(new Request('http://localhost:3000/api/account/deletion',{method:'POST',headers:{origin:'https://evil.invalid'}}))).status,403);
 const deletionRequest=()=>new Request('http://localhost:3000/api/account/deletion',{method:'POST',headers:{origin:'http://localhost:3000'}});
 assert.equal((await deletion.POST(deletionRequest())).status,200);assert.equal((await deletion.POST(deletionRequest())).status,200);
 assert.equal(await p.accountAudit.count({where:{targetId:customer.id,action:'REQUEST_DELETION'}}),requestsBefore+1);
 globalThis.__accountCookies.clear();
 const operational=await auth.validateAdminCredentials('test-admin@example.invalid','Isolated-test-password-2026');assert.equal(operational.role,'ADMIN');
 await auth.createSession({sub:operational.id,email:operational.email,name:operational.name});assert.equal((await auth.getCurrentAdmin()).role,'ADMIN');assert.equal((await users.GET(new Request('http://localhost:3000/api/admin/users'))).status,403);assert.equal((await users.PATCH(request({}))).status,403);
 globalThis.__accountCookies.clear();const principal=await auth.validateAdminCredentials('principal@example.invalid','Principal-test-only');assert.equal(principal.id,'configured-admin');assert.equal(principal.role,'SUPERADMIN');
 await auth.createSession({sub:principal.id,email:principal.email,name:principal.name});const principalToken=globalThis.__accountCookies.get('nineilhas_admin_session');
 const listed=(await (await users.GET(new Request('http://localhost:3000/api/admin/users'))).json()).accounts;assert.equal(listed.filter(a=>a.role==='SUPERADMIN').length,1);assert.equal(listed.find(a=>a.role==='SUPERADMIN').protected,true);assert(!JSON.stringify(listed).includes('passwordHash'));
 assert.equal((await users.PATCH(request({id:customer.id,kind:'CUSTOMER',action:'SUPERADMIN',version:customer.updatedAt.toISOString()}))).status,400);
 assert.equal((await users.PATCH(request({id:customer.id,kind:'CUSTOMER',action:'PROMOTE',version:customer.updatedAt.toISOString()},'https://evil.invalid'))).status,403);
 await assert.rejects(manager.changeAccount(principal,{id:'configured-admin',kind:'CUSTOMER',action:'DELETE',version:new Date().toISOString(),confirmation:'ELIMINAR'}));
 await assert.rejects(manager.changeAccount(operational,{id:customer.id,kind:'CUSTOMER',action:'PROMOTE',version:customer.updatedAt.toISOString()}));
 async function change(action){const current=await p.customerAccount.findUniqueOrThrow({where:{id:customer.id}});globalThis.__accountCookies.clear();globalThis.__accountCookies.set('nineilhas_admin_session',principalToken);const r=await users.PATCH(request({id:customer.id,kind:'CUSTOMER',action,version:current.updatedAt.toISOString()}));assert.equal(r.status,200,await r.text());return p.customerAccount.findUniqueOrThrow({where:{id:customer.id}});}
 const promoted=await change('PROMOTE');assert.equal(promoted.role,'ADMIN');
 globalThis.__accountCookies.clear();await auth.createCustomerSession({sub:customer.id,email:customer.email,firstName:customer.firstName,lastName:customer.lastName});assert.equal((await auth.getCurrentAdmin()).role,'ADMIN');
 await auth.createSession({sub:customer.id,email:customer.email,name:'Test'});const promotedToken=globalThis.__accountCookies.get('nineilhas_admin_session');const customerToken=globalThis.__accountCookies.get('nineilhas_customer_session');
 await change('DEMOTE');globalThis.__accountCookies.clear();globalThis.__accountCookies.set('nineilhas_admin_session',promotedToken);globalThis.__accountCookies.set('nineilhas_customer_session',customerToken);assert.equal(await auth.getCurrentAdmin(),null);assert.equal(await auth.getCurrentCustomer(),null);
 await change('DISABLE');assert.equal(await auth.validateCustomerCredentials(customer.email,'Isolated-test-password-2026'),null);await change('ENABLE');assert(await auth.validateCustomerCredentials(customer.email,'Isolated-test-password-2026'));
 // Database owner cannot accidentally grant roles without the guarded actor transaction.
 await assert.rejects(p.customerAccount.update({where:{id:customer.id},data:{role:'ADMIN'}}));
 await assert.rejects(p.customerAccount.update({where:{id:customer.id},data:{active:false}}));
 await assert.rejects(p.customerAccount.create({data:{id:'configured-admin',firstName:'Fake',lastName:'Root',email:'fake@example.invalid',phone:'0',address:'0'}}));
 await assert.rejects(p.accountSecurity.update({where:{id:'main'},data:{principalId:'fake'}}));
 const audit=await p.accountAudit.findFirstOrThrow({where:{targetId:customer.id}});await assert.rejects(p.accountAudit.delete({where:{id:audit.id}}));
 const current=await p.customerAccount.findUniqueOrThrow({where:{id:customer.id}});await assert.rejects(manager.changeAccount(principal,{id:customer.id,kind:'CUSTOMER',action:'DELETE',version:current.updatedAt.toISOString()}));
 await assert.rejects(manager.changeAccount(principal,{id:customer.id,kind:'CUSTOMER',action:'DISABLE',version:'2020-01-01T00:00:00.000Z'}));
 // Execute the actual deletion path on synthetic data inside a forced rollback.
 const order=await p.siteOrder.create({data:{reference:'isolated-account-order-'+Date.now(),customerAccountId:customer.id,customerName:'Synthetic',customerEmail:customer.email,customerPhone:'0',customerAddress:'Test',totalInCents:4500,whatsappMessage:'Synthetic contact',items:{create:{productName:'Synthetic product',brandName:'Test',unitPriceInCents:4500,quantity:1,lineTotalInCents:4500}}}});
 const beforeAudit=await p.accountAudit.count();
 globalThis.__accountsPrisma={$transaction:async callback=>p.$transaction(async tx=>{await callback(tx);assert.equal(await tx.customerAccount.count({where:{id:customer.id}}),0);const kept=await tx.siteOrder.findUniqueOrThrow({where:{id:order.id},include:{items:true}});assert.equal(kept.totalInCents,4500);assert.equal(kept.items.length,1);assert.equal(kept.customerAccountId,null);assert.equal(kept.customerEmail,null);assert.equal(kept.customerName,'Cliente eliminado');throw new Error('EXPECTED_TEST_ROLLBACK');}, {timeout:30000})};
 // Bundles capture prisma at import time; load a fresh management module with the rollback boundary.
 await build({entryPoints:['src/lib/account-management.ts'],outfile:'.codex-dev/account-test-delete-rollback.mjs',bundle:true,platform:'node',format:'esm',packages:'external',plugins:[plugin]});
 const rollback=await import(pathToFileURL(resolve('.codex-dev/account-test-delete-rollback.mjs')).href);
 await assert.rejects(rollback.changeAccount(principal,{id:customer.id,kind:'CUSTOMER',action:'DELETE',version:current.updatedAt.toISOString(),confirmation:'ELIMINAR'}),/EXPECTED_TEST_ROLLBACK/);
 assert(await p.customerAccount.findUnique({where:{id:customer.id}}));assert.equal(await p.accountAudit.count(),beforeAudit);assert.equal((await p.siteOrder.findUnique({where:{id:order.id}})).customerEmail,customer.email);
 console.log('PASS native login for all 3 roles; server/API denial; promotion/demotion; immediate token revocation; disable/enable; CSRF; protected principal; append-only audit; duplicate deletion requests; stale changes; actual deletion/anonymization path rolled back with financial/items preserved. No real account deleted.');
} finally {await p.$disconnect();}
