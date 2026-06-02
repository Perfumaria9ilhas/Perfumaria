import { FeaturedProductsSlider } from "@/components/home/featured-products-slider";
import { HeroHome } from "@/components/home/hero-home";
import { SampleHome } from "@/components/home/sample-home";
import { TrustHome } from "@/components/home/trust-home";
import { getHomeData } from "@/lib/data";
import { getStoreSettings } from "@/lib/store-settings";

export default async function Home() {
  const [{ featuredProducts, reviews, stats }, settings] = await Promise.all([
    getHomeData(),
    getStoreSettings(),
  ]);

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-4 py-5 lg:px-5 lg:py-7">
      <HeroHome settings={settings} products={featuredProducts.slice(0, 2)} />
      <FeaturedProductsSlider products={featuredProducts} />
      <SampleHome />
      <TrustHome reviews={reviews} stats={stats} />
    </div>
  );
}
