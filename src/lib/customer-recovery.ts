import { randomBytes, createHmac, createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { recoveryAvailability, customerAuthOrigin } from "@/lib/customer-auth-config";
export function authDigest(value: string) { return createHash("sha256").update(value).digest("hex"); }
export async function authThrottle(key:string,limit:number) {
  const id=createHmac("sha256",process.env.ADMIN_SESSION_SECRET!).update(key).digest("hex");
  const rows=await prisma.$queryRaw<{count:number}[]>`INSERT INTO "CustomerAuthThrottle" ("id","count","expiresAt") VALUES (${id},1,NOW()+INTERVAL '10 minutes') ON CONFLICT ("id") DO UPDATE SET "count"=CASE WHEN "CustomerAuthThrottle"."expiresAt"<NOW() THEN 1 ELSE "CustomerAuthThrottle"."count"+1 END,"expiresAt"=CASE WHEN "CustomerAuthThrottle"."expiresAt"<NOW() THEN NOW()+INTERVAL '10 minutes' ELSE "CustomerAuthThrottle"."expiresAt" END RETURNING "count"`;
  return rows[0].count<=limit;
}
export async function requestPasswordReset(email:string) {
  if (!recoveryAvailability().recovery)throw new Error("Recovery unavailable");
  if (!await authThrottle(`reset-email:${email}`,3))return;
  const customer=await prisma.customerAccount.findUnique({where:{email}});
  if (!customer?.active || customer.role!=="CUSTOMER" || !customer.passwordHash)return;
  const token=randomBytes(32).toString("base64url");const id=authDigest(token);
  await prisma.customerPasswordReset.create({data:{id,customerId:customer.id,sessionVersion:customer.sessionVersion,expiresAt:new Date(Date.now()+900000)}});
  const url=`${customerAuthOrigin()}/conta?reset=${encodeURIComponent(token)}`;
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.AUTH_EMAIL_FROM,to:[email],subject:"Recuperar palavra-passe — Perfumaria 9 Ilhas",text:`Para escolher uma nova palavra-passe, abra este link (válido durante 15 minutos):\n${url}\nSe não fez este pedido, ignore este email.`}),signal:AbortSignal.timeout(10000)});
  if (!response.ok){await prisma.customerPasswordReset.deleteMany({where:{id}});throw new Error("Email delivery failed");}
}
export async function resetCustomerPassword(token:string,password:string) {
  const passwordHash=await hash(password,12);
  await prisma.$transaction(async tx=>{
    const reset=await tx.customerPasswordReset.findUnique({where:{id:authDigest(token)},include:{customer:true}});
    if(!reset || reset.expiresAt<=new Date() || !reset.customer.active || reset.customer.role!=="CUSTOMER")throw new Error("Invalid reset");
    const used=await tx.customerPasswordReset.deleteMany({where:{id:reset.id,expiresAt:{gt:new Date()}}});if(used.count!==1)throw new Error("Used reset");
    // The existing DB guard allows session-version changes only through its
    // protected service actor. Elevate only after validating the single-use reset.
    await tx.$queryRaw`SELECT set_config('nineilhas.account_actor','configured-admin',true)`;
    const changed=await tx.customerAccount.updateMany({where:{id:reset.customerId,active:true,role:"CUSTOMER",sessionVersion:reset.sessionVersion},data:{passwordHash,sessionVersion:{increment:1}}});
    if(changed.count!==1)throw new Error("Expired reset");
    await tx.accountAudit.create({data:{actorId:"configured-admin",targetId:reset.customerId,targetKind:"CUSTOMER",action:"RESET_PASSWORD",previous:{sessionVersion:reset.sessionVersion},next:{sessionVersion:reset.sessionVersion+1}}});
    await tx.customerPasswordReset.deleteMany({where:{customerId:reset.customerId}});
  },{maxWait:5000,timeout:20000});
}
