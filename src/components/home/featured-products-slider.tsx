"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, type CSSProperties } from "react";
import { ProductCard } from "@/components/store/product-card";
import type { CatalogProduct } from "@/lib/types";
export function FeaturedProductsSlider({ products, title, description, buttonLabel, href = "/catalogo", visibleCount = 5 }: {
 products: CatalogProduct[]; eyebrow: string; title: string; description: string; buttonLabel: string; href?: string; visibleCount?: number;
}) {
 const rail = useRef<HTMLDivElement>(null);
 if (!products.length) return null;
 return <section className="store-featured">
 <div className="store-section-heading"><div>{title?<h2>{title}</h2>:null}{description?<p className="store-muted store-featured-description">{description}</p>:null}</div>{buttonLabel&&href?<Link href={href}>{buttonLabel}<ArrowRight size={15} /></Link>:null}</div>
 <div className="store-product-rail" ref={rail} style={{"--featured-count":visibleCount} as CSSProperties}>{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
 <div className="store-rail-controls"><button className="store-icon" aria-label="Produtos anteriores" onClick={() => rail.current?.scrollBy({ left: -(rail.current?.clientWidth ?? 300), behavior: "smooth" })}><ArrowLeft size={18} /></button><button className="store-icon" aria-label="Mais produtos em destaque" onClick={() => rail.current?.scrollBy({ left: rail.current?.clientWidth ?? 300, behavior: "smooth" })}><ArrowRight size={18} /></button></div>
 </section>;
}
