import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeObjectText } from "@/lib/text";

const fallbackSettings = {
  id: "main",
  storeName: "9 Ilhas Perfumaria",
  heroTitle: "Perfumes \u00c1rabes Originais",
  heroDescription:
    "Fragr\u00e2ncias selecionadas com entrega r\u00e1pida na Ilha Terceira e envios para A\u00e7ores, Madeira e Portugal Continental.",
  heroPrimaryButtonLabel: "Ver Cat\u00e1logo",
  heroSecondaryButtonLabel: "Sobre N\u00f3s",
  heroBenefitOne: "Perfumes 100% Originais",
  heroBenefitTwo: "Entrega r\u00e1pida na Ilha Terceira",
  heroBenefitThree: "Atendimento personalizado por WhatsApp",
  heroBenefitFour: "Amostras dispon\u00edveis em 5ml",
  heroImageUrl: "",
  heroMaleImageUrl: "",
  heroFemaleImageUrl: "",
  heroUnisexImageUrl: "",
  decantsImageUrl: "",
  heroSlides: [],
  homeFeaturedEyebrow: "Mais vendidos",
  homeFeaturedTitle: "Os Preferidos dos Nossos Clientes",
  homeFeaturedDescription:
    "As fragr\u00e2ncias mais procuradas e recomendadas pelos nossos clientes.",
  homeFeaturedButtonLabel: "Ver todos",
  homeDecantsEyebrow: "Servi\u00e7o complementar",
  homeDecantsTitle: "Experimente antes de comprar",
  homeDecantsDescription:
    "Decants de 5ml e 10ml dispon\u00edveis em perfumes selecionados.",
  homeDecantsButtonLabel: "Ver Decants",
  homeWhyChooseEyebrow: "Confian\u00e7a",
  homeWhyChooseTitle: "Porque Comprar na Perfumaria 9 Ilhas?",
  whyChooseItemOneTitle: "Entrega r\u00e1pida na Ilha Terceira",
  whyChooseItemOneText: "Receba com rapidez e acompanhamento pr\u00f3ximo.",
  whyChooseItemTwoTitle: "Envio para A\u00e7ores, Madeira e Portugal Continental",
  whyChooseItemTwoText: "Preparamos cada encomenda com aten\u00e7\u00e3o e seguran\u00e7a.",
  whyChooseItemThreeTitle: "Perfumes 100% Originais",
  whyChooseItemThreeText: "Selecionamos refer\u00eancias aut\u00eanticas e confi\u00e1veis.",
  whyChooseItemFourTitle: "Atendimento via WhatsApp",
  whyChooseItemFourText: "Respondemos de forma pr\u00f3xima e personalizada.",
  whyChooseItemFiveTitle: "Pagamento Seguro",
  whyChooseItemFiveText: "Confirma\u00e7\u00e3o clara antes de finalizar a encomenda.",
  homeTestimonialsEyebrow: "Testemunhos",
  homeTestimonialsTitle: "O que dizem os nossos clientes",
  catalogTitle: "Cat\u00e1logo de perfumes \u00e1rabes",
  catalogIntro:
    "Escolha por marca, pesquise rapidamente e adicione ao carrinho para finalizar no WhatsApp.",
  contactTitle: "Sobre N\u00f3s",
  contactIntro:
    "Respondemos por WhatsApp e redes sociais com apoio pr\u00f3ximo e confirma\u00e7\u00e3o de disponibilidade.",
  footerDescription:
    "Sele\u00e7\u00e3o cuidada de perfumes \u00e1rabes, cosm\u00e9ticos e ambientadores com apoio a partir da Ilha Terceira.",
  location: "Praia da Vit\u00f3ria, Ilha Terceira, A\u00e7ores, Portugal",
  phone: "+351 912 345 678",
  whatsappNumber: "351912345678",
  whatsappLabel: "Encomendas e apoio",
  openingHours: "Segunda a s\u00e1bado, das 10h00 \u00e0s 19h00",
  contactEmail: "",
  instagramUrl: "https://instagram.com/9ilhasperfumaria",
  facebookUrl: "https://facebook.com/9ilhasperfumaria",
  tiktokUrl: "https://tiktok.com/@9ilhasperfumaria",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function getStoreSettings() {
  noStore();

  const settings =
    (await prisma.storeSettings.findUnique({
      where: { id: "main" },
      include: {
        heroSlides: {
          orderBy: {
            position: "asc",
          },
        },
      },
    })) ?? fallbackSettings;

  return normalizeObjectText(settings);
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
