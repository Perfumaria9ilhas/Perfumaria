import type { Metadata } from "next";
import { CompleteRegistrationTracker } from "@/components/analytics/complete-registration-tracker";
import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/seo";
import { getCatalogData } from "@/lib/data";
import { CustomerAccount } from "@/components/store/customer-account";
import { CustomerLogin } from "@/components/store/customer-login";
import { getStoreSettings } from "@/lib/store-settings";
import { accountPromotions } from "@/lib/account-promotions";
import { recoveryAvailability } from "@/lib/customer-auth-config";
import "./account.css";
import "./login.css";
export const metadata: Metadata = {...buildPageMetadata({title:"Conta de cliente",description:"Área de conta de cliente da Perfumaria 9 Ilhas.",path:"/conta",noIndex:true}),referrer:"no-referrer"};
export default async function ContaPage({searchParams}:{searchParams:Promise<{registered?:string;login?:string;loginError?:string;registerError?:string;mode?:string;reset?:string}>}) {
  const params=await searchParams; const session=await getCurrentCustomer();
  const profile=session?await prisma.customerAccount.findUnique({where:{id:session.id}}):null;
  const settings=await getStoreSettings();
  if(profile) return <><CompleteRegistrationTracker enabled={params.registered==="1"}/><CustomerAccount profile={{firstName:profile.firstName,lastName:profile.lastName,email:profile.email,phone:profile.phone,address:profile.address,deletionRequested:!!profile.deletionRequestedAt}} promotions={accountPromotions((await getCatalogData()).products)} whatsappNumber={settings.whatsappNumber}/></>;
  const photo=await prisma.product.findFirst({where:{active:true,slug:"sabah-al-ward",imageUrl:{not:""}},select:{name:true,imageUrl:true}})
    || await prisma.product.findFirst({where:{active:true,imageUrl:{not:""},productType:{slug:{in:["edp","edt","parfum","extrait","elixir"]}}},select:{name:true,imageUrl:true},orderBy:{name:"asc"}});
  const error=params.loginError?"Não foi possível entrar. Verifique o email e a palavra-passe.":params.registerError?"Não foi possível criar a conta. Confirme os dados e as palavras-passe.":"";
  return <CustomerLogin availability={recoveryAvailability()} imageUrl={photo?.imageUrl||settings.heroImageUrl||""} imageAlt={photo?.name||"Perfumes da nossa seleção"} initialMode={params.registerError||params.mode==="register"?"register":"login"} error={error} resetToken={params.reset&&/^[A-Za-z0-9_-]{43}$/.test(params.reset)?params.reset:undefined} whatsapp={`https://wa.me/${settings.whatsappNumber.replace(/\D/g,"")}`}/>;
}
