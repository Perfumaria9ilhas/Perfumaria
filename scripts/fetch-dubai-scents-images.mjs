import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { load } from "cheerio";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = "https://dubaiscents.de";
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

function normalizeText(value) {
  return slugify(value).replace(/-/g, " ");
}

function scoreCandidate(product, candidate) {
  const targetName = normalizeText(product.name);
  const targetBrand = normalizeText(product.brand.name);
  const candidateTitle = normalizeText(candidate.title ?? "");
  const candidateVendor = normalizeText(candidate.vendor ?? "");
  const haystack = `${candidateTitle} ${candidateVendor}`.trim();

  let score = 0;

  if (candidateTitle === targetName) score += 100;
  if (candidateTitle.includes(targetName)) score += 50;
  if (haystack.includes(targetName)) score += 25;
  if (candidateVendor === targetBrand) score += 20;
  if (haystack.includes(targetBrand)) score += 10;

  return score;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent,
      accept: "text/html,application/json;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent,
      accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.json();
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
      referer: baseUrl,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  sourceCache.set(url, buffer);
  return buffer;
}

function getSuggestUrl(product) {
  const query = encodeURIComponent(`${product.brand.name} ${product.name}`);
  return `${baseUrl}/search/suggest.json?q=${query}&resources[type]=product&resources[limit]=10&resources[options][unavailable_products]=hide&resources[options][fields]=title,product_type,tag,vendor,variants.title`;
}

async function findProductViaSuggest(product) {
  const data = await fetchJson(getSuggestUrl(product));
  const candidates = data?.resources?.results?.products ?? [];

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const bestCandidate = [...candidates]
    .map((candidate) => ({ candidate, score: scoreCandidate(product, candidate) }))
    .sort((left, right) => right.score - left.score)[0];

  if (!bestCandidate || bestCandidate.score <= 0) {
    return null;
  }

  return bestCandidate.candidate;
}

function extractImageFromHtml(html, product) {
  const $ = load(html);

  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) return ogImage;

  const twitterImage = $('meta[name="twitter:image"]').attr("content");
  if (twitterImage) return twitterImage;

  const productJson = $('script[type="application/ld+json"]')
    .toArray()
    .map((element) => $(element).html() ?? "")
    .find(
      (value) =>
        value.includes('"@type":"Product"') || value.includes('"@type": "Product"'),
    );

  if (productJson) {
    try {
      const parsed = JSON.parse(productJson);
      const image = Array.isArray(parsed.image) ? parsed.image[0] : parsed.image;
      if (typeof image === "string") {
        return image;
      }
    } catch {
      // Ignore malformed JSON-LD.
    }
  }

  const images = $("img")
    .toArray()
    .map((element) => ({
      src:
        $(element).attr("src") ||
        $(element).attr("data-src") ||
        $(element).attr("data-image") ||
        "",
      alt: $(element).attr("alt") || "",
    }))
    .filter((item) => item.src);

  const best = images.find((item) =>
    normalizeText(item.alt).includes(normalizeText(product.name)),
  );

  return best?.src ?? images[0]?.src ?? null;
}

function toAbsoluteUrl(url) {
  if (!url) {
    return null;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  if (url.startsWith("/")) {
    return `${baseUrl}${url}`;
  }

  return url;
}

async function resolvePrimaryImage(product) {
  const suggestCandidate = await findProductViaSuggest(product);

  if (!suggestCandidate) {
    return null;
  }

  const directFeatured =
    suggestCandidate.featured_image?.url ||
    suggestCandidate.featured_image?.src ||
    suggestCandidate.image ||
    suggestCandidate.image_url;

  if (directFeatured) {
    return toAbsoluteUrl(directFeatured);
  }

  const candidateUrl = toAbsoluteUrl(suggestCandidate.url);
  if (!candidateUrl) {
    return null;
  }

  const html = await fetchText(candidateUrl);
  return toAbsoluteUrl(extractImageFromHtml(html, product));
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
