import fs from "node:fs/promises";
import path from "node:path";
import initSqlJs from "sql.js";

const root = process.cwd();
const backupPath = path.join(root, "prisma", "dev.db.backup-20260530");
const targetPath = path.join(root, "prisma", "dev.db");

function rowsFrom(db, tableName) {
  const result = db.exec(`SELECT * FROM "${tableName}"`);

  if (!result.length) {
    return [];
  }

  const [{ columns, values }] = result;

  return values.map((valueRow) =>
    Object.fromEntries(columns.map((column, index) => [column, valueRow[index]])),
  );
}

function sqlValue(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function insertRow(db, tableName, row) {
  const columns = Object.keys(row);
  const values = columns.map((column) => sqlValue(row[column]));
  db.run(
    `INSERT INTO "${tableName}" (${columns.map((column) => `"${column}"`).join(", ")}) VALUES (${values.join(", ")})`,
  );
}

async function main() {
  const SQL = await initSqlJs({});
  const backupBuffer = await fs.readFile(backupPath);
  const targetBuffer = await fs.readFile(targetPath);
  const backupDb = new SQL.Database(backupBuffer);
  const targetDb = new SQL.Database(targetBuffer);

  const adminUsers = rowsFrom(backupDb, "AdminUser");
  const brands = rowsFrom(backupDb, "Brand");
  const categories = rowsFrom(backupDb, "Category");
  const products = rowsFrom(backupDb, "Product");

  for (const adminUser of adminUsers) {
    insertRow(targetDb, "AdminUser", adminUser);
  }

  for (const brand of brands) {
    insertRow(targetDb, "Brand", brand);
  }

  for (const category of categories) {
    insertRow(targetDb, "Category", category);
  }

  for (const product of products) {
    insertRow(targetDb, "Product", {
      ...product,
      salePriceInCents: null,
      bestseller: 0,
    });
  }

  insertRow(targetDb, "StoreSettings", {
    id: "main",
    storeName: "9 Ilhas Perfumaria",
    heroTitle: "Perfumes árabes escolhidos com atenção.",
    heroDescription:
      "Uma loja online pensada para a Ilha Terceira, com seleção cuidada e apoio próximo por WhatsApp.",
    catalogTitle: "Catálogo de perfumes árabes",
    catalogIntro:
      "Pesquise por nome ou marca, filtre rapidamente e finalize a sua seleção pelo WhatsApp.",
    contactTitle: "Fale com a 9 Ilhas Perfumaria",
    contactIntro:
      "Esclarecemos dúvidas, confirmamos stock e acompanhamos encomendas a partir da Ilha Terceira.",
    footerDescription:
      "Seleção cuidada de perfumes árabes, cosméticos e ambientadores com envio para Terceira, Açores e Portugal Continental.",
    location: "Ilha Terceira, Açores",
    phone: "+351 912 345 678",
    whatsappNumber: "351912345678",
    whatsappLabel: "Encomendas e apoio",
    openingHours: "Segunda a sábado, das 10h00 às 19h00",
    contactEmail: "geral@9ilhasperfumaria.pt",
    instagramUrl: "https://instagram.com/9ilhasperfumaria",
    facebookUrl: "https://facebook.com/9ilhasperfumaria",
    tiktokUrl: "https://tiktok.com/@9ilhasperfumaria",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const data = Buffer.from(targetDb.export());
  await fs.writeFile(targetPath, data);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
