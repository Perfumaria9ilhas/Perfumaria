import { hash } from "bcryptjs";
import { PrismaClient, ProductAudience } from "@prisma/client";

const prisma = new PrismaClient();

const brands = [
  { name: "Afnan", slug: "afnan", origin: "EAU" },
  { name: "Al Wataniah", slug: "al-wataniah", origin: "EAU" },
  { name: "Armaf", slug: "armaf", origin: "EAU" },
  { name: "Asdaaf", slug: "asdaaf", origin: "EAU" },
  { name: "French Avenue", slug: "french-avenue", origin: "EAU" },
  { name: "Lattafa", slug: "lattafa", origin: "EAU" },
  { name: "Le Chameau", slug: "le-chameau", origin: "EAU" },
  { name: "Maison Alhambra", slug: "maison-alhambra", origin: "EAU" },
];

const categories = [
  {
    name: "Perfumes Arabes",
    slug: "perfumes-arabes",
    description: "Fragrancias intensas, elegantes e marcantes.",
  },
  {
    name: "Cosmeticos",
    slug: "cosmeticos",
    description: "Cuidados de rosto e corpo com assinatura oriental.",
  },
  {
    name: "Ambientadores",
    slug: "ambientadores",
    description: "Difusores e sprays para casa com carater.",
  },
];

const products = [
  {
    name: "9PM",
    slug: "9pm",
    description:
      "Para homens que gostam de marcar presenca e deixar rasto.\n\nNotas de topo: bergamota, maca, canela e lavanda.\nNotas de coracao: flor de laranjeira e lirio-do-vale.\nNotas de fundo: baunilha, fava tonka, ambar e patchouli.\n\nDoce, sedutor, ideal para noite e inverno.\nDuracao: 9/10.\nProjecao: 9/10.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3490,
    salePriceInCents: 3190,
    stock: 9,
    audience: ProductAudience.MASCULINO,
    active: true,
    featured: true,
    bestseller: true,
    brandSlug: "afnan",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "9PM Femme",
    slug: "9pm-femme",
    description:
      "Feminino, elegante e envolvente.\n\nNotas de topo: frutas citricas e frutos vermelhos.\nNotas de coracao: flores brancas e rosa.\nNotas de fundo: baunilha, almiscar e ambar.\n\nRomantico, doce e feminino.\nDuracao: 8/10.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3490,
    salePriceInCents: null,
    stock: 8,
    audience: ProductAudience.FEMININO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "afnan",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "9AM Dive",
    slug: "9am-dive",
    description:
      "Fragrancia fresca e aquatica com citrinos vibrantes, maca verde e notas amadeiradas modernas.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 2990,
    salePriceInCents: null,
    stock: 12,
    audience: ProductAudience.UNISSEXO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "afnan",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Sabah Al Ward",
    slug: "sabah-al-ward",
    description:
      "Delicadeza floral com toque oriental luxuoso.\n\nNotas de topo: mandarina e frutas.\nNotas de coracao: rosa e flores brancas.\nNotas de fundo: baunilha e almiscar.\n\nFeminino, elegante e sofisticado.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 2990,
    salePriceInCents: null,
    stock: 7,
    audience: ProductAudience.FEMININO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "al-wataniah",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Club de Nuit Intense Man",
    slug: "club-de-nuit-intense-man",
    description:
      "Um dos perfumes arabes masculinos mais procurados do mundo.\n\nNotas de topo: limao, bergamota, ananas, maca e groselha negra.\nNotas de coracao: jasmim, rosa e vidoeiro.\nNotas de fundo: ambar cinzento, almiscar, baunilha e patchouli.\n\nMasculino, luxuoso e marcante.\nDuracao: 10/10.\nProjecao: 10/10.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 4490,
    salePriceInCents: 4190,
    stock: 9,
    audience: ProductAudience.MASCULINO,
    active: true,
    featured: true,
    bestseller: true,
    brandSlug: "armaf",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Club de Nuit EDP",
    slug: "club-de-nuit-edp",
    description:
      "Luxo, feminilidade e sofisticacao.\n\nNotas de topo: laranja, toranja, bergamota e pessego.\nNotas de coracao: rosa, jasmim, geranio e lichia.\nNotas de fundo: baunilha, almiscar, patchouli e vetiver.\n\nElegante, pensado para mulher confiante.\nDuracao: 9/10.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 4990,
    salePriceInCents: null,
    stock: 6,
    audience: ProductAudience.FEMININO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "armaf",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Ameerat Al Arab Sugar Crown",
    slug: "ameerat-al-arab-sugar-crown",
    description:
      "Perfume feminino gourmand com baunilha cremosa, acucar caramelizado e flores delicadas.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3290,
    salePriceInCents: null,
    stock: 5,
    audience: ProductAudience.FEMININO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "asdaaf",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Liquid Brun",
    slug: "liquid-brun",
    description:
      "Sofisticacao intensa e luxuosa.\n\nPerfil: madeiras nobres, baunilha e especiarias.\n\nMasculino, elegante e ideal para a noite.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 4290,
    salePriceInCents: null,
    stock: 4,
    audience: ProductAudience.MASCULINO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "french-avenue",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Asad",
    slug: "asad",
    description:
      "Poder, intensidade e elegancia arabe.\n\nNotas de topo: pimenta preta, tabaco e ananas.\nNotas de coracao: cafe, patchouli e iris.\nNotas de fundo: baunilha, ambar, benjoim, madeira seca e ladano.\n\nForte, ideal para noite e inverno.\nDuracao: 10/10.\nProjecao: 9/10.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 2990,
    salePriceInCents: null,
    stock: 3,
    audience: ProductAudience.MASCULINO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Asad Bourbon",
    slug: "asad-bourbon",
    description:
      "Uma interpretacao mais quente e sofisticada da linha Asad.\n\nPerfil: baunilha amadeirada, especiado e ambar.\n\nElegante, sedutor e exclusivo.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3590,
    salePriceInCents: null,
    stock: 3,
    audience: ProductAudience.MASCULINO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Bade'e Al Oud Noble Blush",
    slug: "badee-al-oud-noble-blush",
    description: "Mistura sofisticada de rosa cremosa, oud suave e baunilha elegante.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3990,
    salePriceInCents: null,
    stock: 4,
    audience: ProductAudience.FEMININO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Eclaire",
    slug: "eclaire",
    description:
      "Um verdadeiro dessert em forma de perfume.\n\nPerfil: baunilha, leite, caramelo e acucar.\n\nFeminino, doce e viciante.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3800,
    salePriceInCents: null,
    stock: 2,
    audience: ProductAudience.FEMININO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Eclaire Pistache",
    slug: "eclaire-pistache",
    description:
      "A versao cremosa e sofisticada da linha Eclaire.\n\nPerfil: pistacio, baunilha e creme.\n\nGourmand, luxuoso e diferente.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3990,
    salePriceInCents: null,
    stock: 2,
    audience: ProductAudience.UNISSEXO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Fakhar Gold Extrait",
    slug: "fakhar-gold-extrait",
    description: "Perfume elegante com flores brancas, ambar dourado e fundo sensual amadeirado.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 4290,
    salePriceInCents: null,
    stock: 5,
    audience: ProductAudience.FEMININO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Khamrah",
    slug: "khamrah",
    description:
      "Fragrancia quente e envolvente com canela, baunilha, tamaras, ambar e especiarias orientais.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3890,
    salePriceInCents: 3590,
    stock: 12,
    audience: ProductAudience.UNISSEXO,
    active: true,
    featured: true,
    bestseller: true,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Mayar",
    slug: "mayar",
    description: "Aroma floral frutado feminino com lichia, rosa e almiscar branco.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3490,
    salePriceInCents: null,
    stock: 8,
    audience: ProductAudience.FEMININO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Yara Candy",
    slug: "yara-candy",
    description:
      "Uma explosao doce e divertida.\n\nPerfil: doces, frutas vermelhas e baunilha.\n\nJovem, alegre e viciante.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3490,
    salePriceInCents: null,
    stock: 11,
    audience: ProductAudience.FEMININO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Yara Tous",
    slug: "yara-tous",
    description:
      "Tropical e irresistivel.\n\nPerfil: manga, coco e baunilha.\n\nPerfeito para verao, doce e exotico.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3490,
    salePriceInCents: null,
    stock: 10,
    audience: ProductAudience.FEMININO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Desert Angel Romance",
    slug: "desert-angel-romance",
    description:
      "Perfume romantico e elegante com flores orientais, baunilha e madeiras suaves.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3690,
    salePriceInCents: null,
    stock: 4,
    audience: ProductAudience.FEMININO,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "le-chameau",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Jorge Di Profumo",
    slug: "jorge-di-profumo",
    description:
      "Frescura aquatica com assinatura masculina refinada.\n\nPerfil: citricos, marinho e madeira.\n\nVersatil, perfeito para verao e uso diario.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3290,
    salePriceInCents: null,
    stock: 7,
    audience: ProductAudience.MASCULINO,
    active: true,
    featured: true,
    bestseller: false,
    brandSlug: "maison-alhambra",
    categorySlug: "perfumes-arabes",
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@9ilhas.pt";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "noveilhas123";
  const passwordHash = await hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: "Admin 9 Ilhas" },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Admin 9 Ilhas",
    },
  });

  await prisma.storeSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      storeName: "9 Ilhas Perfumaria",
      heroTitle: "Perfumes arabes escolhidos com atencao.",
      heroDescription:
        "Uma loja online pensada para a Ilha Terceira, com selecao cuidada e apoio proximo por WhatsApp.",
      catalogTitle: "Catalogo de perfumes arabes",
      catalogIntro:
        "Pesquise por nome ou marca, filtre rapidamente e finalize a sua selecao pelo WhatsApp.",
      contactTitle: "Fale com a 9 Ilhas Perfumaria",
      contactIntro:
        "Esclarecemos duvidas, confirmamos stock e acompanhamos encomendas a partir da Ilha Terceira.",
      footerDescription:
        "Selecao cuidada de perfumes arabes, cosmeticos e ambientadores com envio para Terceira, Acores e Portugal Continental.",
      location: "Ilha Terceira, Acores",
      phone: "+351 912 345 678",
      whatsappNumber: "351912345678",
      whatsappLabel: "Encomendas e apoio",
      openingHours: "Segunda a sabado, das 10h00 as 19h00",
      contactEmail: "geral@9ilhasperfumaria.pt",
      instagramUrl: "https://instagram.com/9ilhasperfumaria",
      facebookUrl: "https://facebook.com/9ilhasperfumaria",
      tiktokUrl: "https://tiktok.com/@9ilhasperfumaria",
    },
  });

  const activeOrdersCount = await prisma.siteOrder.count({
    where: {
      status: {
        not: "cancelado",
      },
    },
  });

  await prisma.storeMetric.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      totalSatisfiedCustomers: activeOrdersCount,
    },
  });

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: brand,
      create: brand,
    });
  }

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  for (const product of products) {
    const brand = await prisma.brand.findUniqueOrThrow({
      where: { slug: product.brandSlug },
    });

    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: product.categorySlug },
    });

    const existingProduct = await prisma.product.findUnique({
      where: { slug: product.slug },
      select: { id: true },
    });

    if (!existingProduct) {
      await prisma.product.create({
        data: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          imageUrl: product.imageUrl,
          priceInCents: product.priceInCents,
          salePriceInCents: product.salePriceInCents,
          stock: product.stock,
          audience: product.audience,
          active: product.active,
          featured: product.featured,
          bestseller: product.bestseller,
          brandId: brand.id,
          categoryId: category.id,
        },
      });
    }
  }
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
