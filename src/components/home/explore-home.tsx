import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/types";
import { getProductAudienceLabel } from "@/lib/product-audience";

export function ExploreHome({ products }: { products: CatalogProduct[] }) {
  const seen = new Set<string>();
  const items = products.filter((product) => {
    if (seen.has(product.audience)) return false;
    seen.add(product.audience);
    return true;
  }).slice(0, 3);

  if (items.length < 2) return null;

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--gold)]">Descobrir</p>
        <h2 className="mt-2 font-serif text-[2rem] leading-tight text-[color:var(--ink)] min-[390px]:text-[2.15rem] md:text-[3rem]">Explore por público</h2>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:snap-none md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
        {items.map((product) => {
          const label = getProductAudienceLabel(product.audience);
          return (
            <Link
              key={product.audience}
              href={`/catalogo?audience=${product.audience.toLowerCase()}`}
              className="group block w-[44%] min-w-[44%] shrink-0 snap-start md:relative md:min-h-[31rem] md:w-auto md:min-w-0 md:overflow-hidden md:bg-[color:#eee9e2]"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[color:#eee9e2] md:absolute md:inset-0 md:aspect-auto">
                <Image src={product.imageUrl} alt={label} fill sizes="(max-width: 768px) 44vw, 33vw" className="object-contain p-3 transition duration-500 group-hover:scale-[1.025] md:p-8" />
                <div className="absolute inset-0 hidden bg-gradient-to-t from-black/55 via-transparent to-transparent md:block" />
              </div>
              <h3 className="mt-2 font-serif text-lg leading-tight text-[color:var(--ink)] md:hidden">{label}</h3>
              <div className="absolute inset-x-0 bottom-0 hidden p-6 text-white md:block">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/75">Perfumes</p>
                <h3 className="mt-1 font-serif text-3xl text-white">{label}</h3>
                <span className="mt-4 inline-block border-b border-white/70 pb-1 text-sm">Explorar</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
