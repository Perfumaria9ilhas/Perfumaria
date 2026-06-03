import { FeaturedProductsSlider } from "@/components/home/featured-products-slider";
import { HeroHome } from "@/components/home/hero-home";
import { SampleHome } from "@/components/home/sample-home";
import { TrustHome } from "@/components/home/trust-home";
import { getHomeData } from "@/lib/data";

export default async function Home() {
  const { featuredProducts, reviews, stats } = await getHomeData();

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-4 py-5 lg:px-5 lg:py-7">
      <HeroHome products={featuredProducts.slice(0, 2)} />
      <SampleHome />
      <FeaturedProductsSlider products={featuredProducts} />
      <TrustHome reviews={reviews} stats={stats} />
    </div>
  );
}
