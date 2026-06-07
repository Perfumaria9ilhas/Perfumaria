import { FeaturedProductsSlider } from "@/components/home/featured-products-slider";
import { HeroHome } from "@/components/home/hero-home";
import { SampleHome } from "@/components/home/sample-home";
import { TrustHome } from "@/components/home/trust-home";
import { WhyChooseHome } from "@/components/home/why-choose-home";
import { getHomeData } from "@/lib/data";
import { getStoreSettings } from "@/lib/store-settings";

export default async function Home() {
  const [{ featuredProducts, reviews, stats }, settings] = await Promise.all([
    getHomeData(),
    getStoreSettings(),
  ]);

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-4 py-5 lg:px-5 lg:py-6">
      <HeroHome
        title={settings.heroTitle}
        description={settings.heroDescription}
        primaryButtonLabel={settings.heroPrimaryButtonLabel}
        secondaryButtonLabel={settings.heroSecondaryButtonLabel}
        benefits={[
          settings.heroBenefitOne,
          settings.heroBenefitTwo,
          settings.heroBenefitThree,
          settings.heroBenefitFour,
        ]}
      />
      <FeaturedProductsSlider
        products={featuredProducts}
        eyebrow={settings.homeFeaturedEyebrow}
        title={settings.homeFeaturedTitle}
        description={settings.homeFeaturedDescription}
        buttonLabel={settings.homeFeaturedButtonLabel}
      />
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
