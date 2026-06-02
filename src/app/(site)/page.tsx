import { AccountInviteHome } from "@/components/home/account-invite";
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
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 py-4 lg:px-5 lg:py-6">
      <HeroHome settings={settings} />
      <AccountInviteHome />
      <SampleHome />
      <FeaturedProductsSlider products={featuredProducts} />
      <TrustHome reviews={reviews} stats={stats} />
    </div>
  );
}
