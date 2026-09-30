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
    <section className="space-y-6">
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--gold)]">Descobrir</p>
        <h2 className="mt-2 font-serif text-[2.2rem] leading-tight text-[color:var(--ink)] sm:text-[3rem]">Explore por público</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((product) => {
          const label = getProductAudienceLabel(product.audience);
          return (
            <Link
              key={product.audience}
              href={`/catalogo?audience=${product.audience.toLowerCase()}`}
              className="group relative min-h-[19rem] overflow-hidden bg-[color:#eee9e2] sm:min-h-[25rem] md:min-h-[31rem]"
            >
              <Image src={product.imageUrl} alt={label} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain p-5 transition duration-500 group-hover:scale-[1.025] sm:p-8" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
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
