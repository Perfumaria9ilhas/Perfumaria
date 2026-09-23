import type { Metadata } from "next";
import Link from "next/link";
import { FeaturedProductsSlider } from "@/components/home/featured-products-slider";
import { HeroHome } from "@/components/home/hero-home";
import { SampleHome } from "@/components/home/sample-home";
import { TrustHome } from "@/components/home/trust-home";
import { WhyChooseHome } from "@/components/home/why-choose-home";
import { getHomeData } from "@/lib/data";
import {
  buildPageMetadata,
  buildProductListJsonLd,
  safeJsonLd,
} from "@/lib/seo";
import { getStoreSettings } from "@/lib/store-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();

  return buildPageMetadata({
    title: "Perfumaria 9 Ilhas | Perfumes \u00c1rabes na Ilha Terceira e A\u00e7ores",
    description:
      "Perfumes \u00e1rabes originais na Praia da Vit\u00f3ria, Ilha Terceira, com entrega local e envios para A\u00e7ores, Madeira e Portugal Continental.",
    path: "/",
    imageUrl: settings.heroImageUrl,
  });
}

export default async function Home() {
  const [{ featuredProducts, reviews, stats }, settings] = await Promise.all([
    getHomeData(),
    getStoreSettings(),
  ]);

  const featuredJsonLd = buildProductListJsonLd(
    featuredProducts.slice(0, 10),
    settings.homeFeaturedTitle,
    "/",
  );

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-4 py-5 lg:px-5 lg:py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(featuredJsonLd) }}
      />

      <HeroHome
        title={settings.heroTitle}
        description={settings.heroDescription}
        primaryButtonLabel={settings.heroPrimaryButtonLabel}
        secondaryButtonLabel={settings.heroSecondaryButtonLabel}
        imageUrl={settings.heroImageUrl}
        benefits={[
          settings.heroBenefitOne,
          settings.heroBenefitTwo,
          settings.heroBenefitThree,
          settings.heroBenefitFour,
        ]}
      />

      <FeaturedProductsSlider
        products={featuredProducts}
        eyebrow=""
        title={settings.homeFeaturedTitle}
        description={settings.homeFeaturedDescription}
        buttonLabel={settings.homeFeaturedButtonLabel}
      />

      <section className="rounded-[1.6rem] border border-[rgba(194,162,119,0.14)] bg-white/75 px-5 py-4 shadow-[0_10px_24px_rgba(95,71,49,0.04)] lg:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
          <div className="space-y-2">
            <h2 className="text-[1.35rem] leading-tight text-[color:var(--ink)] sm:text-[1.65rem]">
              {"Perfumes \u00e1rabes originais na Ilha Terceira"}
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              {
                "A Perfumaria 9 Ilhas, na Praia da Vit\u00f3ria, ajuda clientes da Ilha Terceira e de todo o arquip\u00e9lago dos A\u00e7ores a encontrar fragr\u00e2ncias \u00e1rabes originais com apoio pr\u00f3ximo por WhatsApp, entrega local e envios para Madeira e Portugal Continental."
              }
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/perfumes-arabes-acores"
              className="rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-4 py-2.5 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)]"
            >
              Saber mais
            </Link>
          </div>
        </div>
      </section>
      <SampleHome
        imageUrl={settings.decantsImageUrl}
        eyebrow={settings.homeDecantsEyebrow}
        title={settings.homeDecantsTitle}
        description={settings.homeDecantsDescription}
        buttonLabel={settings.homeDecantsButtonLabel}
      />
      <WhyChooseHome
        eyebrow={settings.homeWhyChooseEyebrow}
        title={settings.homeWhyChooseTitle}
        items={[
          {
            title: settings.whyChooseItemOneTitle,
            text: settings.whyChooseItemOneText,
          },
          {
            title: settings.whyChooseItemTwoTitle,
            text: settings.whyChooseItemTwoText,
          },
          {
            title: settings.whyChooseItemThreeTitle,
            text: settings.whyChooseItemThreeText,
          },
          {
            title: settings.whyChooseItemFourTitle,
            text: settings.whyChooseItemFourText,
          },
          {
            title: settings.whyChooseItemFiveTitle,
            text: settings.whyChooseItemFiveText,
          },
        ]}
      />
      <TrustHome
        reviews={reviews}
        stats={stats}
        eyebrow={settings.homeTestimonialsEyebrow}
        title={settings.homeTestimonialsTitle}
      />
    </div>
  );
}
