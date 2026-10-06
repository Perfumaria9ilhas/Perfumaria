import { NextResponse } from "next/server";
import sharp from "sharp";
import { getCurrentAdmin } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/image-storage";

export async function POST(request: Request) {
  if (!await getCurrentAdmin()) return NextResponse.json({error:"Sessão expirada."},{status:401});
  const origin=request.headers.get("origin");
  if(origin && new URL(origin).host!==request.headers.get("host")) return NextResponse.json({error:"Origem inválida."},{status:403});
  if(Number(request.headers.get("content-length"))>8*1024*1024) return NextResponse.json({error:"Máximo 7 MB por imagem."},{status:413});
  try {
    const form=await request.formData(); const file=form.get("file");
    if(!(file instanceof File) || !file.size || file.size>7*1024*1024 || !["image/jpeg","image/png","image/webp","image/avif"].includes(file.type)) return NextResponse.json({error:"Escolha uma imagem JPG, PNG, WebP ou AVIF até 7 MB."},{status:400});
    const bytes=Buffer.from(await file.arrayBuffer());
    const metadata=await sharp(bytes,{limitInputPixels:40000000}).metadata();
    if(!metadata.width || !metadata.height || !["jpeg","png","webp","avif","heif"].includes(metadata.format??"")) throw new Error("Imagem inválida");
    const normalized=await sharp(bytes).rotate().resize({width:2400,height:2400,fit:"inside",withoutEnlargement:true}).webp({quality:90}).toBuffer();
    return NextResponse.json({url:await saveUploadedImage(new File([new Uint8Array(normalized)],"homepage.webp",{type:"image/webp"}))});
  } catch { return NextResponse.json({error:"Não foi possível processar a imagem."},{status:400}); }
}
