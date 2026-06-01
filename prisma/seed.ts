import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

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
    name: "Perfumes Árabes",
    slug: "perfumes-arabes",
    description: "Fragrâncias intensas, elegantes e marcantes.",
  },
  {
    name: "Cosméticos",
    slug: "cosmeticos",
    description: "Cuidados de rosto e corpo com assinatura oriental.",
  },
  {
    name: "Ambientadores",
    slug: "ambientadores",
    description: "Difusores e sprays para casa com carácter.",
  },
];

const products = [
  {
    name: "9PM",
    slug: "9pm",
    description:
      "Fragrância masculina intensa e sedutora com notas de maçã, canela, lavanda e baunilha. Ideal para noites e clima mais fresco.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3490,
    salePriceInCents: 3190,
    stock: 9,
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
      "Perfume feminino doce e elegante com frutas vermelhas, flores brancas e fundo quente de baunilha e almíscar.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3490,
    salePriceInCents: null,
    stock: 8,
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
      "Fragrância fresca e aquática com citrinos vibrantes, maçã verde e notas amadeiradas modernas.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 2990,
    salePriceInCents: null,
    stock: 12,
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
      "Aroma floral feminino sofisticado com rosa, frutas doces e almíscar suave.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 2990,
    salePriceInCents: null,
    stock: 7,
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
      "Fragrância masculina intensa com limão, ananás, bétula e almíscar. Um dos perfumes árabes mais populares.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 4490,
    salePriceInCents: 4190,
    stock: 9,
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
      "Versão mais refinada e duradoura da linha Club de Nuit, com excelente projeção e elegância.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 4990,
    salePriceInCents: null,
    stock: 6,
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
      "Perfume feminino gourmand com baunilha cremosa, açúcar caramelizado e flores delicadas.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3290,
    salePriceInCents: null,
    stock: 5,
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
      "Fragrância quente e sofisticada com cacau, madeira escura, âmbar e especiarias envolventes.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 4290,
    salePriceInCents: null,
    stock: 4,
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
      "Perfume masculino intenso com especiarias, tabaco, âmbar e madeiras quentes.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 2990,
    salePriceInCents: null,
    stock: 3,
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
      "Interpretação mais gourmand da linha Asad com baunilha, bourbon e acordes amadeirados.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3590,
    salePriceInCents: null,
    stock: 3,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Bade'e Al Oud Noble Blush",
    slug: "badee-al-oud-noble-blush",
    description:
      "Mistura sofisticada de rosa cremosa, oud suave e baunilha elegante.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3990,
    salePriceInCents: null,
    stock: 4,
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
      "Perfume doce e cremoso inspirado em sobremesas luxuosas com baunilha e caramelo.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3800,
    salePriceInCents: null,
    stock: 2,
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
      "Fragrância gourmand com pistácio cremoso, baunilha e notas açucaradas sofisticadas.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3990,
    salePriceInCents: null,
    stock: 2,
    active: true,
    featured: false,
    bestseller: false,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Fakhar Gold Extrait",
    slug: "fakhar-gold-extrait",
    description:
      "Perfume elegante com flores brancas, âmbar dourado e fundo sensual amadeirado.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 4290,
    salePriceInCents: null,
    stock: 5,
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
      "Fragrância quente e envolvente com canela, baunilha, tâmaras, âmbar e especiarias orientais.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3890,
    salePriceInCents: 3590,
    stock: 12,
    active: true,
    featured: true,
    bestseller: true,
    brandSlug: "lattafa",
    categorySlug: "perfumes-arabes",
  },
  {
    name: "Mayar",
    slug: "mayar",
    description:
      "Aroma floral frutado feminino com lichia, rosa e almíscar branco.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3490,
    salePriceInCents: null,
    stock: 8,
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
      "Perfume feminino doce com frutas açucaradas, baunilha cremosa e almíscar delicado.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3490,
    salePriceInCents: null,
    stock: 11,
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
      "Fragrância tropical feminina com manga, coco, flores exóticas e almíscar suave.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3490,
    salePriceInCents: null,
    stock: 10,
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
      "Perfume romântico e elegante com flores orientais, baunilha e madeiras suaves.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3690,
    salePriceInCents: null,
    stock: 4,
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
      "Fragrância masculina fresca e aquática inspirada no Mediterrâneo, com notas marinhas e âmbar.",
    imageUrl: "/placeholders/perfume-default.svg",
    priceInCents: 3290,
    salePriceInCents: null,
    stock: 7,
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
    update: {
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
    },
    create: {
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

  await prisma.product.deleteMany({
    where: {
      slug: {
        notIn: products.map((product) => product.slug),
      },
    },
  });

  await prisma.brand.deleteMany({
    where: {
      slug: {
        notIn: brands.map((brand) => brand.slug),
      },
    },
  });

  for (const product of products) {
    const brand = await prisma.brand.findUniqueOrThrow({
      where: { slug: product.brandSlug },
    });
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug: product.categorySlug },
    });

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        priceInCents: product.priceInCents,
        salePriceInCents: product.salePriceInCents,
        stock: product.stock,
        active: product.active,
        featured: product.featured,
        bestseller: product.bestseller,
        brandId: brand.id,
        categoryId: category.id,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        imageUrl: product.imageUrl,
        priceInCents: product.priceInCents,
        salePriceInCents: product.salePriceInCents,
        stock: product.stock,
        active: product.active,
        featured: product.featured,
        bestseller: product.bestseller,
        brandId: brand.id,
        categoryId: category.id,
      },
    });
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
