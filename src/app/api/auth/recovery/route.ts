import { NextResponse } from "next/server";
import { z } from "zod";
import { isAccountRequestOriginAllowed } from "@/lib/account-request-origin";
import { authThrottle, requestPasswordReset, resetCustomerPassword } from "@/lib/customer-recovery";
import { recoveryAvailability } from "@/lib/customer-auth-config";
const schema=z.union([z.object({email:z.email().max(254)}).strict(),z.object({token:z.string().regex(/^[A-Za-z0-9_-]{43}$/),password:z.string().min(6).max(72),confirmPassword:z.string()}).strict().refine(v=>v.password===v.confirmPassword)]);
export async function POST(request:Request) {
  const headers={"Cache-Control":"no-store"};
  if(!isAccountRequestOriginAllowed(request))return NextResponse.json({error:"Origem inválida."},{status:403,headers});
  if(!recoveryAvailability().recovery)return NextResponse.json({error:"Recuperação por email ainda indisponível. Contacte a loja."},{status:503,headers});
  try {
    const input=schema.safeParse(await request.json());if(!input.success)return NextResponse.json({error:"Confirme os dados e as palavras-passe."},{status:400,headers});
    const ip=request.headers.get("x-forwarded-for")?.split(",")[0].trim()||"unknown";
    if(!await authThrottle(`recovery-ip:${ip}`,10))return NextResponse.json({error:"Demasiados pedidos. Tente mais tarde."},{status:429,headers});
    if("email" in input.data){await requestPasswordReset(input.data.email.trim().toLowerCase());return NextResponse.json({message:"Se existir uma conta elegível, receberá um email com as instruções."},{headers});}
    await resetCustomerPassword(input.data.token,input.data.password);return NextResponse.json({message:"Palavra-passe atualizada. Entre com a nova palavra-passe."},{headers});
  }catch{return NextResponse.json({error:"Não foi possível concluir. Tente novamente ou peça um novo link."},{status:400,headers});}
}
