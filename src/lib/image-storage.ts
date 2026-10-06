import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function saveUploadedImage(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const rawExtension = file.name.split(".").pop()?.toLowerCase() ?? file.type.split("/").pop()?.toLowerCase() ?? "jpg";
  const extension = rawExtension.replace(/[^a-z0-9]/g, "") || "jpg";
  const storedImage = await prisma.storedImage.create({data:{fileName:`${randomUUID()}.${extension}`,contentType:file.type?.trim() || `image/${extension}`,data:bytes},select:{id:true}});
  return `/api/upload-image?asset=${encodeURIComponent(storedImage.id)}`;
}
