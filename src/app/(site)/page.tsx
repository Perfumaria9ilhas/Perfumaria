import { HeroHome } from "@/components/home/hero-home";
import { SampleHome } from "@/components/home/sample-home";
import { TrustHome } from "@/components/home/trust-home";
import { getHomeData } from "@/lib/data";
import { getStoreSettings } from "@/lib/store-settings";

export default async function Home() {
  const [{ reviews, stats }, settings] = await Promise.all([
    getHomeData(),
    getStoreSettings(),
  ]);

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-4 py-4 lg:px-4 lg:py-5">
      <HeroHome settings={settings} />
      <SampleHome imageUrl={settings.decantsImageUrl} />
      <TrustHome reviews={reviews} stats={stats} />
    </div>
  );
}
