import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const outputRoot = path.join(process.cwd(), "public", "perfumes");
const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0 Safari/537.36";

const downloadedHashes = new Set();
const sourceCache = new Map();

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "pt-PT,pt;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

async function fetchBuffer(url) {
  const cached = sourceCache.get(url);

  if (cached) {
    return cached;
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent,
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      referer: "https://www.google.com/",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Resposta sem imagem em ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  sourceCache.set(url, buffer);
  return buffer;
}

function extractImageUrls(html) {
  const urls = new Set();

  for (const match of html.matchAll(/"ou":"(.*?)"/g)) {
    try {
      urls.add(JSON.parse(`"${match[1]}"`));
    } catch {
      // ignore
    }
  }

  for (const match of html.matchAll(/imgurl=([^&"]+)/g)) {
    try {
      urls.add(decodeURIComponent(match[1]));
    } catch {
      // ignore
    }
  }

  for (const match of html.matchAll(/\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|avif))"/gi)) {
    urls.add(match[1]);
  }

  return [...urls].filter((url) => {
    const lower = url.toLowerCase();
    return (
      lower.startsWith("http") &&
      !lower.includes("gstatic.com") &&
      !lower.includes("googleusercontent.com") &&
      !lower.includes("encrypted-tbn0")
    );
  });
}

async function resolvePrimaryImage(product) {
  const query = encodeURIComponent(`${product.brand.name} ${product.name} perfume`);
  const url = `https://www.google.com/search?tbm=isch&hl=pt-PT&q=${query}`;
  const html = await fetchText(url);
  const candidates = extractImageUrls(html);
  return candidates[0] ?? null;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeImage(product, imageBuffer) {
  const brandSlug = slugify(product.brand.name);
  const productSlug = product.slug || slugify(product.name);
  const targetDir = path.join(outputRoot, brandSlug);
  const targetFile = path.join(targetDir, `${productSlug}.webp`);

  await ensureDir(targetDir);

  const transformed = await sharp(imageBuffer)
    .resize(800, 800, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 88 })
    .toBuffer();

  const hash = crypto.createHash("sha256").update(transformed).digest("hex");

  if (downloadedHashes.has(hash)) {
    console.log(`- duplicada ignorada: ${product.brand.name} ${product.name}`);
    return;
  }

  downloadedHashes.add(hash);
  await fs.writeFile(targetFile, transformed);
  console.log(`- guardada: public/perfumes/${brandSlug}/${productSlug}.webp`);
}

async function main() {
  const products = await prisma.product.findMany({
    include: { brand: true },
    orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
  });

  await ensureDir(outputRoot);
  console.log(`A processar ${products.length} perfumes...`);

  for (const product of products) {
    const label = `${product.brand.name} ${product.name}`;

    try {
      const imageUrl = await resolvePrimaryImage(product);

      if (!imageUrl) {
        console.log(`- sem imagem encontrada: ${label}`);
        continue;
      }

      const imageBuffer = await fetchBuffer(imageUrl);
      await writeImage(product, imageBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`- erro em ${label}: ${message}`);
    }
  }
}

await main().finally(async () => {
  await prisma.$disconnect();
});
