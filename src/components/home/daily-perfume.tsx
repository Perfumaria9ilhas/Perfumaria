import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CatalogProduct } from "@/lib/types";
import { formatPrice, getSalePriceInCents } from "@/lib/format";
export function DailyPerfume({product,title}:{product:CatalogProduct;title:string}) {
 return <section className="store-daily" aria-label="Perfume do Dia"><div className="store-daily-photo"><Image src={product.imageUrl} alt={product.name} fill unoptimized sizes="(max-width:767px) 180px, 280px" className="object-contain"/></div><div className="min-w-0">{title?<p className="store-eyebrow">{title}</p>:null}<h2 className="mt-2 font-serif text-3xl">{product.name}</h2><p className="store-muted mt-1">{product.brand.name}</p><span className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-900">−{new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 }).format((1 - getSalePriceInCents(product) / product.priceInCents) * 100)}%{product.dailyDiscountApplied !== false ? " hoje" : " · promoção ativa"}</span><p className="my-4 flex flex-wrap items-center gap-3"><del className="store-muted">{formatPrice(product.priceInCents)}</del><strong className="text-2xl">{formatPrice(getSalePriceInCents(product))}</strong></p><Link href={`/catalogo?produto=${encodeURIComponent(product.slug)}`} className="store-button">Ver perfume<ArrowRight size={18}/></Link></div></section>;
}
