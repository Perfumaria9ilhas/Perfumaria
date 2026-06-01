import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const mappings = [
  {
    source: "9am Dive.webp",
    target: "public/perfumes/afnan/9am-dive.webp",
  },
  {
    source: "liquid-brun-limited-edition___260302.jpeg",
    target: "public/perfumes/french-avenue/liquid-brun.webp",
  },
];

async function main() {
  for (const item of mappings) {
    const sourcePath = path.join(process.cwd(), "public", "fotos-produtos", item.source);
    const targetPath = path.join(process.cwd(), item.target);

    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    const input = await fs.readFile(sourcePath);
    await sharp(input)
      .resize(800, 800, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: 88 })
      .toFile(targetPath);

    console.log(`Atualizada: ${item.target}`);
  }
}

await main();
