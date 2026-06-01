import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

const fallbackSettings = {
  id: "main",
  storeName: "9 Ilhas Perfumaria",
  heroTitle: "Perfumes arabes com presenca, entrega proxima.",
  heroDescription:
    "Perfumes arabes, cosmeticos e ambientadores com atendimento a partir da Ilha Terceira.",
  heroImageUrl: "",
  heroSlides: [],
  catalogTitle: "Catalogo de perfumes arabes",
  catalogIntro:
    "Escolha por marca, pesquise rapidamente e adicione ao carrinho para finalizar no WhatsApp.",
  contactTitle: "Fale connosco",
  contactIntro:
    "Respondemos por WhatsApp e redes sociais com apoio proximo e confirmacao de disponibilidade.",
  footerDescription:
    "Selecao cuidada de perfumes arabes, cosmeticos e ambientadores com apoio a partir da Ilha Terceira.",
  location: "Ilha Terceira, Acores",
  phone: "+351 912 345 678",
  whatsappNumber: "351912345678",
  whatsappLabel: "Encomendas e apoio",
  openingHours: "Segunda a sabado, das 10h00 as 19h00",
  contactEmail: "",
  instagramUrl: "https://instagram.com/9ilhasperfumaria",
  facebookUrl: "https://facebook.com/9ilhasperfumaria",
  tiktokUrl: "https://tiktok.com/@9ilhasperfumaria",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function getStoreSettings() {
  noStore();

  return (
    (await prisma.storeSettings.findUnique({
      where: { id: "main" },
      include: {
        heroSlides: {
          orderBy: {
            position: "asc",
          },
        },
      },
    })) ?? fallbackSettings
  );
}

export async function getSocialLinks() {
  const settings = await getStoreSettings();

  return [
    { label: "Instagram", href: settings.instagramUrl ?? undefined },
    { label: "Facebook", href: settings.facebookUrl ?? undefined },
    { label: "TikTok", href: settings.tiktokUrl ?? undefined },
    {
      label: "WhatsApp",
      href: settings.whatsappNumber
        ? `https://wa.me/${settings.whatsappNumber}`
        : undefined,
    },
  ].filter((item) => Boolean(item.href));
}
