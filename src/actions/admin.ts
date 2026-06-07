"use server";

import { randomUUID } from "node:crypto";
import { ProductAudience, ProductConcentration } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hash } from "bcryptjs";
import {
  clearCustomerSession,
  clearSession,
  createCustomerSession,
  createSession,
  getCurrentCustomer,
  requireAdmin,
  validateAdminCredentials,
  validateCustomerCredentials,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

const brandSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  origin: z.string().optional(),
});

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
});

const defaultProductImage = "";

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().min(10),
  priceInEuros: z.string().min(1),
  salePriceInEuros: z.string().optional().nullable(),
  stock: z.coerce.number().int().min(0),
  audience: z.nativeEnum(ProductAudience),
  concentration: z.nativeEnum(ProductConcentration),
  availableInFiveMl: z.boolean().default(false),
  availableInTenMl: z.boolean().default(false),
  active: z.boolean().default(false),
  featured: z.boolean().default(false),
  bestseller: z.boolean().default(false),
});

const settingsSchema = z.object({
  storeName: z.string().min(2),
  heroTitle: z.string().min(4),
  heroDescription: z.string().min(10),
  heroPrimaryButtonLabel: z.string().min(2),
  heroSecondaryButtonLabel: z.string().min(2),
  heroBenefitOne: z.string().min(2),
  heroBenefitTwo: z.string().min(2),
  heroBenefitThree: z.string().min(2),
  heroBenefitFour: z.string().min(2),
  homeFeaturedEyebrow: z.string().min(2),
  homeFeaturedTitle: z.string().min(4),
  homeFeaturedDescription: z.string().min(10),
  homeFeaturedButtonLabel: z.string().min(2),
  homeDecantsEyebrow: z.string().min(2),
  homeDecantsTitle: z.string().min(4),
  homeDecantsDescription: z.string().min(10),
  homeDecantsButtonLabel: z.string().min(2),
  homeWhyChooseEyebrow: z.string().min(2),
  homeWhyChooseTitle: z.string().min(4),
  whyChooseItemOneTitle: z.string().min(2),
  whyChooseItemOneText: z.string().min(2),
  whyChooseItemTwoTitle: z.string().min(2),
  whyChooseItemTwoText: z.string().min(2),
  whyChooseItemThreeTitle: z.string().min(2),
  whyChooseItemThreeText: z.string().min(2),
  whyChooseItemFourTitle: z.string().min(2),
  whyChooseItemFourText: z.string().min(2),
  whyChooseItemFiveTitle: z.string().min(2),
  whyChooseItemFiveText: z.string().min(2),
  homeTestimonialsEyebrow: z.string().min(2),
  homeTestimonialsTitle: z.string().min(4),
  catalogTitle: z.string().min(4),
  catalogIntro: z.string().min(10),
  footerDescription: z.string().min(10),
  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  tiktokUrl: z.string().optional(),
});

const aboutSettingsSchema = z.object({
  contactTitle: z.string().min(4),
  contactIntro: z.string().min(10),
  location: z.string().min(2),
  phone: z.string().min(6),
  whatsappNumber: z.string().min(6),
  whatsappLabel: z.string().min(2),
  openingHours: z.string().min(4),
  contactEmail: z.string().optional(),
});

const customerAccountSchema = z
  .object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.email(),
    phone: z.string().min(6),
    address: z.string().min(6),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmPassword"],
  });

const customerLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

const orderStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["novo", "confirmado", "pago", "enviado", "entregue", "cancelado"]),
});

const storeReviewSchema = z.object({
  name: z.string().min(2).max(60),
  rating: z.coerce.number().int().min(0).max(5),
  comment: z.string().min(6).max(500),
});

function normalizeCustomerEmail(email: string) {
  return email.trim().toLowerCase();
}

async function saveUploadedImage(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const rawExtension =
    file.name.split(".").pop()?.toLowerCase() ??
    file.type.split("/").pop()?.toLowerCase() ??
    "jpg";
  const extension = rawExtension.replace(/[^a-z0-9]/g, "") || "jpg";
  const fileName = `${randomUUID()}.${extension}`;
  const contentType = file.type?.trim() || `image/${extension}`;

  const storedImage = await prisma.storedImage.create({
    data: {
      fileName,
      contentType,
      data: bytes,
    },
    select: {
      id: true,
    },
  });

  return `/api/upload-image?asset=${encodeURIComponent(storedImage.id)}`;
}

function parseEuroPriceToCents(value?: null | string) {
  const normalized = value?.trim().replace("€", "").replace(/\s+/g, "").replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Preço inválido");
  }

  return Math.round(parsed * 100);
}

export async function loginAdmin(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/admin/login?error=1");
  }

  const user = await validateAdminCredentials(parsed.data.email, parsed.data.password);

  if (!user) {
    redirect("/admin/login?error=1");
  }

  await createSession({
    sub: user.id,
    email: user.email,
    name: user.name,
  });

  redirect("/admin");
}

export async function logoutAdmin() {
  await clearSession();
  redirect("/admin/login");
}

export async function saveBrand(formData: FormData) {
  await requireAdmin();

  const parsed = brandSchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    origin: formData.get("origin") || undefined,
  });

  const slug = slugify(parsed.name);

  if (parsed.id) {
    await prisma.brand.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        origin: parsed.origin,
        slug,
      },
    });
  } else {
    await prisma.brand.create({
      data: {
        name: parsed.name,
        origin: parsed.origin,
        slug,
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/marcas");
  revalidatePath("/catalogo");
}

export async function deleteBrand(formData: FormData) {
  await requireAdmin();
  const id = z.string().parse(formData.get("id"));
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/admin/marcas");
  revalidatePath("/catalogo");
}

export async function saveCategory(formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  const slug = slugify(parsed.name);

  if (parsed.id) {
    await prisma.category.update({
      where: { id: parsed.id },
      data: {
        name: parsed.name,
        description: parsed.description,
        slug,
      },
    });
  } else {
    await prisma.category.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        slug,
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/categorias");
  revalidatePath("/catalogo");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = z.string().parse(formData.get("id"));
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/admin/categorias");
  revalidatePath("/catalogo");
}

export async function saveProduct(formData: FormData) {
  await requireAdmin();

  const imageFile = formData.get("imageFile");
  const currentImageUrl = formData.get("currentImageUrl")?.toString().trim() ?? "";

  const parsed = productSchema.parse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    brandId: formData.get("brandId"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description"),
    priceInEuros: formData.get("priceInEuros"),
    salePriceInEuros: formData.get("salePriceInEuros") || undefined,
    stock: formData.get("stock"),
    audience: formData.get("audience"),
    concentration: formData.get("concentration"),
    availableInFiveMl: formData.get("availableInFiveMl") === "on",
    availableInTenMl: formData.get("availableInTenMl") === "on",
    active: formData.get("active") === "on",
    featured: formData.get("featured") === "on",
    bestseller: formData.get("bestseller") === "on",
  });

  const priceInCents = parseEuroPriceToCents(parsed.priceInEuros);
  const rawSalePriceInCents = parseEuroPriceToCents(parsed.salePriceInEuros ?? undefined);

  if (priceInCents === null) {
    throw new Error("Preço base inválido");
  }

  const salePriceInCents =
    rawSalePriceInCents && rawSalePriceInCents < priceInCents
      ? rawSalePriceInCents
      : null;

  const slug = slugify(parsed.name);

  let finalImageUrl = currentImageUrl || defaultProductImage;

  if (typeof imageFile !== "string" && imageFile && imageFile.size > 0) {
    finalImageUrl = await saveUploadedImage(imageFile);
  }

  const data = {
    name: parsed.name,
    slug,
    brandId: parsed.brandId,
    categoryId: parsed.categoryId,
    description: parsed.description,
    priceInCents,
    salePriceInCents,
    stock: parsed.stock,
    imageUrl: finalImageUrl,
    audience: parsed.audience,
    concentration: parsed.concentration,
    availableInFiveMl: parsed.availableInFiveMl,
    availableInTenMl: parsed.availableInTenMl,
    active: parsed.active,
    featured: parsed.featured,
    bestseller: parsed.bestseller,
  };

  if (parsed.id) {
    await prisma.product.update({
      where: { id: parsed.id },
      data,
    });
  } else {
    await prisma.product.create({
      data,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/produtos");
  revalidatePath("/catalogo");
  revalidatePath("/");
  redirect("/admin/produtos?saved=1");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = z.string().parse(formData.get("id"));
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/admin/produtos");
  revalidatePath("/catalogo");
  revalidatePath("/");
}

export async function saveStoreSettings(formData: FormData) {
  await requireAdmin();

  const currentSettings = await prisma.storeSettings.findUnique({
    where: { id: "main" },
    select: {
      heroImageUrl: true,
      decantsImageUrl: true,
      contactTitle: true,
      contactIntro: true,
      location: true,
      phone: true,
      whatsappNumber: true,
      whatsappLabel: true,
      openingHours: true,
      contactEmail: true,
    },
  });

  const parsed = settingsSchema.parse({
    storeName: formData.get("storeName"),
    heroTitle: formData.get("heroTitle"),
    heroDescription: formData.get("heroDescription"),
    heroPrimaryButtonLabel: formData.get("heroPrimaryButtonLabel"),
    heroSecondaryButtonLabel: formData.get("heroSecondaryButtonLabel"),
    heroBenefitOne: formData.get("heroBenefitOne"),
    heroBenefitTwo: formData.get("heroBenefitTwo"),
    heroBenefitThree: formData.get("heroBenefitThree"),
    heroBenefitFour: formData.get("heroBenefitFour"),
    homeFeaturedEyebrow: formData.get("homeFeaturedEyebrow"),
    homeFeaturedTitle: formData.get("homeFeaturedTitle"),
    homeFeaturedDescription: formData.get("homeFeaturedDescription"),
    homeFeaturedButtonLabel: formData.get("homeFeaturedButtonLabel"),
    homeDecantsEyebrow: formData.get("homeDecantsEyebrow"),
    homeDecantsTitle: formData.get("homeDecantsTitle"),
    homeDecantsDescription: formData.get("homeDecantsDescription"),
    homeDecantsButtonLabel: formData.get("homeDecantsButtonLabel"),
    homeWhyChooseEyebrow: formData.get("homeWhyChooseEyebrow"),
    homeWhyChooseTitle: formData.get("homeWhyChooseTitle"),
    whyChooseItemOneTitle: formData.get("whyChooseItemOneTitle"),
    whyChooseItemOneText: formData.get("whyChooseItemOneText"),
    whyChooseItemTwoTitle: formData.get("whyChooseItemTwoTitle"),
    whyChooseItemTwoText: formData.get("whyChooseItemTwoText"),
    whyChooseItemThreeTitle: formData.get("whyChooseItemThreeTitle"),
    whyChooseItemThreeText: formData.get("whyChooseItemThreeText"),
    whyChooseItemFourTitle: formData.get("whyChooseItemFourTitle"),
    whyChooseItemFourText: formData.get("whyChooseItemFourText"),
    whyChooseItemFiveTitle: formData.get("whyChooseItemFiveTitle"),
    whyChooseItemFiveText: formData.get("whyChooseItemFiveText"),
    homeTestimonialsEyebrow: formData.get("homeTestimonialsEyebrow"),
    homeTestimonialsTitle: formData.get("homeTestimonialsTitle"),
    catalogTitle: formData.get("catalogTitle"),
    catalogIntro: formData.get("catalogIntro"),
    footerDescription: formData.get("footerDescription"),
    instagramUrl: formData.get("instagramUrl")?.toString().trim() || undefined,
    facebookUrl: formData.get("facebookUrl")?.toString().trim() || undefined,
    tiktokUrl: formData.get("tiktokUrl")?.toString().trim() || undefined,
  });

  const heroImageFile = formData.get("heroImageFile");
  const decantsImageFile = formData.get("decantsImageFile");
  let heroImageUrl = currentSettings?.heroImageUrl ?? null;
  let decantsImageUrl = currentSettings?.decantsImageUrl ?? null;

  if (typeof heroImageFile !== "string" && heroImageFile && heroImageFile.size > 0) {
    heroImageUrl = await saveUploadedImage(heroImageFile);
  }

  if (typeof decantsImageFile !== "string" && decantsImageFile && decantsImageFile.size > 0) {
    decantsImageUrl = await saveUploadedImage(decantsImageFile);
  }

  await prisma.storeSettings.upsert({
    where: { id: "main" },
    update: {
      ...parsed,
      heroImageUrl,
      decantsImageUrl,
      heroSlides: {
        deleteMany: {},
      },
    },
    create: {
      id: "main",
      ...parsed,
      heroImageUrl,
      decantsImageUrl,
      contactTitle: currentSettings?.contactTitle ?? "Sobre Nós",
      contactIntro:
        currentSettings?.contactIntro ??
        "Somos a Ana e o Carlos, da Ilha Terceira. Criámos a Perfumaria 9 Ilhas para trazer perfumes árabes originais aos Açores, com atendimento próximo, produtos originais e entrega rápida.",
      location: currentSettings?.location ?? "Ilha Terceira, Açores",
      phone: currentSettings?.phone ?? "+351 965420948",
      whatsappNumber: currentSettings?.whatsappNumber ?? "351965420948",
      whatsappLabel: currentSettings?.whatsappLabel ?? "Apoio por WhatsApp",
      openingHours:
        currentSettings?.openingHours ?? "Segunda a sábado, das 08h00 às 22h00",
      contactEmail: currentSettings?.contactEmail ?? "perfumaria9ilhas@hotmail.com",
    },
  });

  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/contactos");
  revalidatePath("/sobre-nos");
  revalidatePath("/condicoes");
  revalidatePath("/admin");
  revalidatePath("/admin/loja");
  redirect("/admin/loja?saved=1");
}

export async function saveAboutSettings(formData: FormData) {
  await requireAdmin();

  const parsed = aboutSettingsSchema.parse({
    contactTitle: formData.get("contactTitle"),
    contactIntro: formData.get("contactIntro"),
    location: formData.get("location"),
    phone: formData.get("phone"),
    whatsappNumber: formData.get("whatsappNumber"),
    whatsappLabel: formData.get("whatsappLabel"),
    openingHours: formData.get("openingHours"),
    contactEmail: formData.get("contactEmail")?.toString().trim() || undefined,
  });

  await prisma.storeSettings.upsert({
    where: { id: "main" },
    update: parsed,
    create: {
      id: "main",
      storeName: "9 Ilhas Perfumaria",
      heroTitle: "Perfumes árabes com presença, entrega próxima.",
      heroDescription:
        "Perfumes árabes, cosméticos e ambientadores com atendimento a partir da Ilha Terceira.",
      heroPrimaryButtonLabel: "Ver Catálogo",
      heroSecondaryButtonLabel: "Sobre Nós",
      heroBenefitOne: "Perfumes 100% Originais",
      heroBenefitTwo: "Entrega rápida na Ilha Terceira",
      heroBenefitThree: "Atendimento personalizado por WhatsApp",
      heroBenefitFour: "Amostras disponíveis em 5ml",
      homeFeaturedEyebrow: "Mais vendidos",
      homeFeaturedTitle: "Os Preferidos dos Nossos Clientes",
      homeFeaturedDescription:
        "As fragrâncias mais procuradas e recomendadas pelos nossos clientes.",
      homeFeaturedButtonLabel: "Ver todos",
      homeDecantsEyebrow: "Serviço complementar",
      homeDecantsTitle: "Experimente antes de comprar",
      homeDecantsDescription:
        "Decants de 5ml e 10ml disponíveis em perfumes selecionados.",
      homeDecantsButtonLabel: "Ver Decants",
      homeWhyChooseEyebrow: "Confiança",
      homeWhyChooseTitle: "Porque Comprar na Perfumaria 9 Ilhas?",
      whyChooseItemOneTitle: "Entrega rápida na Ilha Terceira",
      whyChooseItemOneText: "Receba com rapidez e acompanhamento próximo.",
      whyChooseItemTwoTitle: "Envio para Açores, Madeira e Portugal Continental",
      whyChooseItemTwoText: "Preparamos cada encomenda com atenção e segurança.",
      whyChooseItemThreeTitle: "Perfumes 100% Originais",
      whyChooseItemThreeText: "Selecionamos referências autênticas e confiáveis.",
      whyChooseItemFourTitle: "Atendimento via WhatsApp",
      whyChooseItemFourText: "Respondemos de forma próxima e personalizada.",
      whyChooseItemFiveTitle: "Pagamento Seguro",
      whyChooseItemFiveText: "Confirmação clara antes de finalizar a encomenda.",
      homeTestimonialsEyebrow: "Testemunhos",
      homeTestimonialsTitle: "O que dizem os nossos clientes",
      catalogTitle: "Catálogo de perfumes árabes",
      catalogIntro:
        "Escolha por marca, pesquise rapidamente e adicione ao carrinho para finalizar no WhatsApp.",
      footerDescription:
        "Seleção cuidada de perfumes árabes, cosméticos e ambientadores com envio para Terceira, Açores e Portugal Continental.",
      ...parsed,
    },
  });

  revalidatePath("/sobre-nos");
  revalidatePath("/contactos");
  revalidatePath("/admin");
  revalidatePath("/admin/sobre-nos");
  redirect("/admin/sobre-nos?saved=1");
}

export async function createCustomerAccount(formData: FormData) {
  const parsed = customerAccountSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/conta?registerError=1");
  }

  const normalizedEmail = normalizeCustomerEmail(parsed.data.email);
  const passwordHash = await hash(parsed.data.password, 10);

  const customer = await prisma.customerAccount.upsert({
    where: { email: normalizedEmail },
    update: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: normalizedEmail,
      phone: parsed.data.phone,
      address: parsed.data.address,
      passwordHash,
    },
    create: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: normalizedEmail,
      phone: parsed.data.phone,
      address: parsed.data.address,
      passwordHash,
    },
  });

  await createCustomerSession({
    sub: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/clientes");
  redirect("/conta?registered=1");
}

export async function loginCustomer(formData: FormData) {
  const parsed = customerLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/conta?loginError=1");
  }

  const normalizedEmail = normalizeCustomerEmail(parsed.data.email);

  const admin = await validateAdminCredentials(normalizedEmail, parsed.data.password);

  if (admin) {
    await clearCustomerSession();
    await createSession({
      sub: admin.id,
      email: admin.email,
      name: admin.name,
    });

    redirect("/admin");
  }

  const customer = await validateCustomerCredentials(normalizedEmail, parsed.data.password);

  if (!customer) {
    redirect("/conta?loginError=1");
  }

  await clearSession();
  await createCustomerSession({
    sub: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
  });

  redirect("/conta?login=1");
}

export async function logoutCustomer() {
  await clearCustomerSession();
  redirect("/conta");
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();

  const parsed = orderStatusSchema.parse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  await prisma.siteOrder.update({
    where: { id: parsed.id },
    data: {
      status: parsed.status,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
}

export async function deleteOrder(formData: FormData) {
  await requireAdmin();

  const id = z.string().min(1).parse(formData.get("id"));

  await prisma.siteOrder.delete({
    where: { id },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
}

export async function getAuthenticatedCustomerSnapshot() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return null;
  }

  return prisma.customerAccount.findUnique({
    where: { id: customer.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      createdAt: true,
    },
  });
}

export async function submitStoreReview(formData: FormData) {
  const parsed = storeReviewSchema.safeParse({
    name: formData.get("name"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    redirect("/?reviewError=1#avaliacoes");
  }

  await prisma.storeReview.create({
    data: {
      name: parsed.data.name,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      approved: true,
    },
  });

  revalidatePath("/");
  redirect("/?reviewSaved=1#avaliacoes");
}

export async function deleteStoreReview(formData: FormData) {
  await requireAdmin();

  const id = z.string().min(1).parse(formData.get("id"));

  await prisma.storeReview.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/comentarios");
}
