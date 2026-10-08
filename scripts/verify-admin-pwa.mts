import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { load } from "cheerio";
import nextEnv from "@next/env";
import sharp from "sharp";
import { compareMobileSales } from "../src/lib/admin-sales-sort";
import { isTrustedPushEndpoint, pushSubscriptionSchema } from "../src/lib/admin-push-validation";
nextEnv.loadEnvConfig(process.cwd(), true);
const base = process.env.PWA_TEST_URL ?? "http://localhost:3000";
const sales = [
 { id: "paid-new", status: "PAID", deliveryStatus: "DELIVERED", createdAt: "2026-10-08T10:00:00Z" },
 { id: "payment-old", status: "PENDING", deliveryStatus: "DELIVERED", createdAt: "2026-10-01T10:00:00Z" },
 { id: "delivery-new", status: "PAID", deliveryStatus: "PENDING", createdAt: "2026-10-07T10:00:00Z" },
];
assert.deepEqual([...sales].sort(compareMobileSales).map(s => s.id), ["delivery-new", "payment-old", "paid-new"]);
assert.equal(sales[0].id,"paid-new");
for (const endpoint of ["https://fcm.googleapis.com/fcm/send/test", "https://web.push.apple.com/test", "https://updates.push.services.mozilla.com/wpush/v2/test"]) assert(isTrustedPushEndpoint(endpoint));
for (const endpoint of ["http://fcm.googleapis.com/test", "https://127.0.0.1/test", "https://fcm.googleapis.com.attacker.test/x", "https://user:secret@fcm.googleapis.com/test", "https://web.push.apple.com:444/test"]) assert(!isTrustedPushEndpoint(endpoint));
assert(!pushSubscriptionSchema.safeParse({ endpoint: "https://127.0.0.1", keys: {} }).success);
console.log("PASS mobile pending-first ordering, immutable desktop input, push endpoint validation");
const manifestResponse = await fetch(base + "/admin/manifest.webmanifest");
assert.equal(manifestResponse.status,200); const manifest = await manifestResponse.json();
assert.equal(manifest.name,"9 Ilhas Admin"); assert.equal(manifest.display,"standalone"); assert.equal(manifest.start_url,"/admin"); assert.equal(manifest.scope,"/admin");
for (const icon of manifest.icons) { const response = await fetch(base+icon.src); assert.equal(response.status,200); const meta = await sharp(Buffer.from(await response.arrayBuffer())).metadata(); assert.equal(`${meta.width}x${meta.height}`,icon.sizes); }
const apple = await sharp(Buffer.from(await (await fetch(base+"/admin-pwa/apple-touch-icon.png")).arrayBuffer())).metadata(); assert.equal(apple.width,180);
const workerResponse=await fetch(base+"/admin/sw.js"); assert.equal(workerResponse.status,200); assert.equal(workerResponse.headers.get("service-worker-allowed"),"/admin");
const worker=await workerResponse.text(); assert(!/\bcaches\./.test(worker)); assert(worker.includes('"no-store"'));
console.log("PASS standalone manifest, admin scope, PNG/iOS icons, worker without private caches");
for (const path of ["/api/admin/alerts", "/api/admin/push"]) assert.equal((await fetch(base+path)).status,401);
const login=load(await(await fetch(base+"/admin/login")).text()); const form=new FormData();
login('form input[type=hidden]').each((_,el)=>{ const name=login(el).attr("name"); if(name) form.set(name,login(el).attr("value")??""); });
assert(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD,"Test credentials unavailable"); form.set("email",process.env.ADMIN_EMAIL!); form.set("password",process.env.ADMIN_PASSWORD!);
const auth=await fetch(base+"/admin/login",{method:"POST",body:form,redirect:"manual",headers:{Origin:base}});
const cookie=auth.headers.getSetCookie().map(c=>c.split(";")[0]).join("; "); assert(cookie.includes("nineilhas_admin_session="));
for(const path of ["/admin", "/admin/stock?view=sales&period=all", "/admin/stock?view=stock", "/admin/produtos", "/admin/mais", "/admin/definicoes"]) {
 const response=await fetch(base+path,{headers:{Cookie:cookie}}); assert.equal(response.status,200,path); assert(response.headers.get("cache-control")?.includes(base.endsWith(":3000") ? "no-cache" : "no-store")); const html=load(await response.text());
 assert.equal(html('nav[aria-label="Navegação principal mobile"] a').length,5); assert.equal(html('link[rel="manifest"]').attr("href"),"/admin/manifest.webmanifest");
 console.log("PASS authenticated route and private headers",path);
}
const alerts=await(await fetch(base+"/api/admin/alerts",{headers:{Cookie:cookie}})).json(); assert.equal(alerts.alerts.length,3); assert.equal(alerts.total,alerts.alerts.reduce((n:number,a:{count:number})=>n+a.count,0)); assert(!JSON.stringify(alerts).includes("fingerprint"));
const blocked=await fetch(base+"/api/admin/push",{method:"POST",headers:{Cookie:cookie,Origin:"https://attacker.test","Content-Type":"application/json"},body:JSON.stringify({action:"test"})}); assert.equal(blocked.status,403);
const publicHome=load(await(await fetch(base+"/")).text()); assert(!publicHome('link[rel="manifest"]').length); assert(!publicHome('nav[aria-label="Navegação principal mobile"]').length);
assert((await readFile("src/app/admin/mobile.css","utf8")).includes("@media (max-width: 1023px)"));
console.log("PASS real aggregate alerts, authentication/origin checks, public storefront isolation. No business data written.");
