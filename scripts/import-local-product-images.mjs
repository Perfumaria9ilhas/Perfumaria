import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const sourceDir = path.join(process.cwd(), "public", "fotos-produtos");
const outputRoot = path.join(process.cwd(), "public", "perfumes");
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tokenize(value) {
  return slugify(value)
    .split("-")
    .filter(Boolean)
    .filter((token) => !["edp", "spray", "perfume", "parfum", "100ml", "box", "bottle"].includes(token));
}

function similarity(product, fileBaseName) {
  const productNameTokens = new Set(tokenize(product.name));
  const brandTokens = new Set(tokenize(product.brand.name));
  const fileTokens = new Set(tokenize(fileBaseName));

  let score = 0;

  for (const token of productNameTokens) {
    if (fileTokens.has(token)) {
      score += 14;
    }
  }

  for (const token of brandTokens) {
    if (fileTokens.has(token)) {
      score += 5;
    }
  }

  const productSlug = slugify(product.name);
  const productBrandSlug = slugify(product.brand.name);
  const fileSlug = slugify(fileBaseName);
  const joinedNameTokens = [...productNameTokens].join("-");

  if (fileSlug.includes(productSlug)) score += 60;
  if (fileSlug.includes(productBrandSlug)) score += 20;
  if (fileSlug === productSlug) score += 100;
  if (joinedNameTokens && fileSlug.includes(joinedNameTokens)) score += 45;

  if (productSlug.includes("9pm-femme") && fileSlug.includes("femme")) score += 90;
  if (productSlug.includes("9am-dive") && fileSlug.includes("dive")) score += 90;
  if (productSlug.includes("fakhar-gold-extrait") && fileSlug.includes("fakhar")) score += 110;
  if (productSlug.includes("khamrah") && fileSlug.includes("khamrah")) score += 140;
  if (productSlug.includes("club-de-nuit-intense-man") && fileSlug.includes("intense")) score += 80;

  if (fileSlug.includes("ladies") && !productSlug.includes("femme")) score -= 80;
  if (fileSlug.includes("maleka") && !productSlug.includes("maleka")) score -= 70;
  if (fileSlug.includes("nebras") && !productSlug.includes("nebras")) score -= 100;
  if (fileSlug.includes("dalal") && !productSlug.includes("dalal")) score -= 100;
  if (fileSlug.includes("atheeri") && !productSlug.includes("atheeri")) score -= 100;
  if (fileSlug.includes("vanilla-freak") && !productSlug.includes("vanilla-freak")) score -= 100;
  if (fileSlug.includes("choco-overdose") && !productSlug.includes("choco-overdose")) score -= 100;

  return score;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function getSourceFiles() {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      name: entry.name,
      ext: path.extname(entry.name).toLowerCase(),
      base: path.basename(entry.name, path.extname(entry.name)),
      fullPath: path.join(sourceDir, entry.name),
    }))
    .filter((entry) => allowedExtensions.has(entry.ext));
}

async function writeTargetImage(product, sourceFile) {
  const brandSlug = slugify(product.brand.name);
  const targetDir = path.join(outputRoot, brandSlug);
  const targetFile = path.join(targetDir, `${product.slug}.webp`);

  await ensureDir(targetDir);

  const input = await fs.readFile(sourceFile.fullPath);
  await sharp(input)
    .resize(800, 800, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 88 })
    .toFile(targetFile);

  console.log(`- ${product.brand.name} ${product.name} <= ${sourceFile.name}`);
}

async function main() {
  const products = await prisma.product.findMany({
    include: { brand: true },
    orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
  });

  const sourceFiles = await getSourceFiles();
  const usedFiles = new Set();

  console.log(`A processar ${products.length} perfumes com ${sourceFiles.length} ficheiros locais...`);

  for (const product of products) {
    const candidates = sourceFiles
      .filter((file) => !usedFiles.has(file.fullPath))
      .map((file) => ({ file, score: similarity(product, file.base) }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score);

    const best = candidates[0];

    if (!best) {
      console.log(`- sem correspondência: ${product.brand.name} ${product.name}`);
      continue;
    }

    usedFiles.add(best.file.fullPath);
    await writeTargetImage(product, best.file);
  }

  const unusedFiles = sourceFiles.filter((file) => !usedFiles.has(file.fullPath));

  if (unusedFiles.length) {
    console.log("\nFicheiros não usados:");
    for (const file of unusedFiles) {
      console.log(`- ${file.name}`);
    }
  }
}

await main().finally(async () => {
  await prisma.$disconnect();
});
