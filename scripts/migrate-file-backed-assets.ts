import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const uploadsDir = path.join(process.cwd(), "public", "uploads");

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function extractFileName(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  const match = /^\/api\/upload-image\?file=([^&]+)$/.exec(url.trim());

  if (!match) {
    return null;
  }

  return decodeURIComponent(match[1]);
}

async function ensureStoredAsset(fileName: string) {
  const existing = await prisma.storedImage.findUnique({
    where: { fileName },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const filePath = path.join(uploadsDir, fileName);
  try {
    await access(filePath);
  } catch {
    return null;
  }

  const bytes = await readFile(filePath);
  const extension = path.extname(fileName).toLowerCase();
  const contentType = contentTypes[extension] ?? "application/octet-stream";

  const created = await prisma.storedImage.create({
    data: {
      fileName,
      contentType,
      data: bytes,
    },
    select: { id: true },
  });

  return created.id;
}

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      imageUrl: true,
    },
  });

  let migratedProducts = 0;

  for (const product of products) {
    const fileName = extractFileName(product.imageUrl);

    if (!fileName) {
      continue;
    }

    try {
      const assetId = await ensureStoredAsset(fileName);
      const newUrl = `/api/upload-image?asset=${assetId}`;

      if (!assetId) {
        continue;
      }

      if (newUrl !== product.imageUrl) {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: newUrl },
        });
        migratedProducts += 1;
      }
    } catch (error) {
      console.warn(`Nao foi possivel migrar a imagem do produto ${product.id}: ${fileName}`);
      console.warn(error);
    }
  }

  const settings = await prisma.storeSettings.findUnique({
    where: { id: "main" },
    include: {
      heroSlides: true,
    },
  });

  let migratedSlides = 0;

  if (settings) {
    const heroFileName = extractFileName(settings.heroImageUrl);

    if (heroFileName) {
      try {
        const assetId = await ensureStoredAsset(heroFileName);
        if (assetId) {
          const newUrl = `/api/upload-image?asset=${assetId}`;

          if (newUrl !== settings.heroImageUrl) {
            await prisma.storeSettings.update({
              where: { id: settings.id },
              data: {
                heroImageUrl: newUrl,
              },
            });
            migratedSlides += 1;
          }
        }
      } catch (error) {
        console.warn(`Nao foi possivel migrar a imagem principal da homepage: ${heroFileName}`);
        console.warn(error);
      }
    }

    for (const slide of settings.heroSlides) {
      const fileName = extractFileName(slide.imageUrl);

      if (!fileName) {
        continue;
      }

      try {
        const assetId = await ensureStoredAsset(fileName);
        if (!assetId) {
          continue;
        }

        const newUrl = `/api/upload-image?asset=${assetId}`;

        if (newUrl !== slide.imageUrl) {
          await prisma.heroSlide.update({
            where: { id: slide.id },
            data: {
              imageUrl: newUrl,
            },
          });
          migratedSlides += 1;
        }
      } catch (error) {
        console.warn(`Nao foi possivel migrar o slide ${slide.id}: ${fileName}`);
        console.warn(error);
      }
    }
  }

  console.log(
    `Migracao concluida. Produtos atualizados: ${migratedProducts}. Slides atualizados: ${migratedSlides}.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
