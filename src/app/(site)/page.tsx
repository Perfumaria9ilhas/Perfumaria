import { DailyPerfume } from "@/components/home/daily-perfume";
import { readHomepageState, resolveHomepageConfig, type HomepageSection } from "@/lib/homepage-config";
import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { FeaturedProductsSlider } from "@/components/home/featured-products-slider";
import { CollectionRail, CollectionPromos, StoreTrustPoints } from "@/components/home/store-collections";
import { getStoreCollections } from "@/lib/store-collections";
import { HeroHome } from "@/components/home/hero-home";
import { TrustHome } from "@/components/home/trust-home";
import { getCatalogData, getHomeData } from "@/lib/data";
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
    imageUrl: readHomepageState(settings.homepageConfig).editor?.hero.imageUrl || settings.heroImageUrl,
  });
}

export default async function Home() {
  const [{ featuredProducts, reviews, stats }, settings, { products }] = await Promise.all([
    getHomeData(),
    getStoreSettings(),
    getCatalogData(),
  ]);
  const config=resolveHomepageConfig(settings,getStoreCollections(products));
  const daily=products.find(p=>p.id===readHomepageState(settings.homepageConfig).perfumeOfDayId&&"perfumeOfDay" in p&&p.perfumeOfDay);
  const sections:Record<HomepageSection,React.ReactNode>={
    hero:<HeroHome config={config.hero}/>,
    collections:<CollectionRail config={config.collections}/>,
    featured:<FeaturedProductsSlider products={featuredProducts} eyebrow="" title={config.featured.title} description={config.featured.text} buttonLabel={config.featured.buttonLabel} href={config.featured.href} visibleCount={config.featured.visibleCount}/>,
    daily:daily?<DailyPerfume product={daily} title={config.daily.title}/>:null,
    promos:<CollectionPromos config={config.promos}/>,
    trust:<StoreTrustPoints config={config.trust}/>,
    seo:config.seo.title||config.seo.text||(config.seo.buttonLabel&&config.seo.href)?<section className="border-y border-[color:var(--line)] px-1 py-7"><div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-center"><div className="space-y-2">{config.seo.title?<h2 className="text-2xl">{config.seo.title}</h2>:null}{config.seo.text?<p className="max-w-3xl text-sm leading-6 text-slate-600">{config.seo.text}</p>:null}</div>{config.seo.buttonLabel&&config.seo.href?<Link href={config.seo.href} className="store-button justify-self-start lg:justify-self-end">{config.seo.buttonLabel}</Link>:null}</div></section>:null,
    reviews:<TrustHome reviews={reviews} stats={stats} eyebrow={config.reviews.eyebrow} title={config.reviews.title}/>,
  };
  const featuredJsonLd=buildProductListJsonLd(featuredProducts.slice(0,10),config.featured.title,"/");
  return <div className="store-home store-container"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(featuredJsonLd)}}/>{(Object.keys(sections) as HomepageSection[]).filter(key=>config[key].active).sort((a,b)=>config[a].order-config[b].order).map(key=><React.Fragment key={key}>{sections[key]}</React.Fragment>)}</div>;
}
