import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

const fallbackSettings = {
  id: "main",
  storeName: "9 Ilhas Perfumaria",
  heroTitle: "Perfumes Árabes Originais",
  heroDescription:
    "Fragrâncias selecionadas com entrega rápida na Ilha Terceira e envios para Açores, Madeira e Portugal Continental.",
  heroPrimaryButtonLabel: "Ver Catálogo",
  heroSecondaryButtonLabel: "Sobre Nós",
  heroBenefitOne: "Perfumes 100% Originais",
  heroBenefitTwo: "Entrega rápida na Ilha Terceira",
  heroBenefitThree: "Atendimento personalizado por WhatsApp",
  heroBenefitFour: "Amostras disponíveis em 5ml",
  heroImageUrl: "",
  heroMaleImageUrl: "",
  heroFemaleImageUrl: "",
  heroUnisexImageUrl: "",
  decantsImageUrl: "",
  heroSlides: [],
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
  contactTitle: "Sobre Nós",
  contactIntro:
    "Respondemos por WhatsApp e redes sociais com apoio próximo e confirmação de disponibilidade.",
  footerDescription:
    "Seleção cuidada de perfumes árabes, cosméticos e ambientadores com apoio a partir da Ilha Terceira.",
  location: "Ilha Terceira, Açores",
  phone: "+351 912 345 678",
  whatsappNumber: "351912345678",
  whatsappLabel: "Encomendas e apoio",
  openingHours: "Segunda a sábado, das 10h00 às 19h00",
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
