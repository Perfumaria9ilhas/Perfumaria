"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { ProductCard } from "@/components/store/product-card";
import type { CatalogProduct } from "@/lib/types";
export function FeaturedProductsSlider({ products, title, description, buttonLabel }: {
 products: CatalogProduct[]; eyebrow: string; title: string; description: string; buttonLabel: string;
}) {
 const rail = useRef<HTMLDivElement>(null);
 if (!products.length) return null;
 return <section className="store-featured">
 <div className="store-section-heading"><div><h2>{title}</h2><p className="store-muted store-featured-description">{description}</p></div><Link href="/catalogo">{buttonLabel}<ArrowRight size={15} /></Link></div>
 <div className="store-product-rail" ref={rail}>{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
 <div className="store-rail-controls"><button className="store-icon" aria-label="Produtos anteriores" onClick={() => rail.current?.scrollBy({ left: -(rail.current?.clientWidth ?? 300), behavior: "smooth" })}><ArrowLeft size={18} /></button><button className="store-icon" aria-label="Mais produtos em destaque" onClick={() => rail.current?.scrollBy({ left: rail.current?.clientWidth ?? 300, behavior: "smooth" })}><ArrowRight size={18} /></button></div>
 </section>;
}
