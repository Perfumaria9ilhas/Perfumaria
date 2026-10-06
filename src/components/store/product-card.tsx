"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { FavoriteButton } from "@/components/providers/favorites-provider";
import { formatPrice } from "@/lib/format";
import type { CatalogProduct } from "@/lib/types";

export function ProductCard({ product, price, originalPrice, children, onOpen, priority = false }: {
  product: CatalogProduct; price?: number; originalPrice?: number | null; children?: ReactNode; onOpen?: () => void; priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const bottlePrice = product.salePriceInCents && product.salePriceInCents < product.priceInCents ? product.salePriceInCents : product.priceInCents;
  const displayPrice = price ?? bottlePrice;
  const previousPrice = originalPrice ?? (price === undefined ? product.priceInCents : displayPrice);
  const badge = product.perfumeOfDay ? "-10% hoje" : product.bestseller ? "Mais vendido" : product.featured ? "Em destaque" : null;
  return <article className="store-product-card">
    <div className="store-card-image">
      <Link href={`/catalogo?produto=${encodeURIComponent(product.slug)}`} scroll={false} onClick={onOpen} aria-label={`Ver ${product.name}`}>
        <Image src={!product.imageUrl || failed ? "/logo-9-ilhas.svg" : product.imageUrl} alt={product.name} fill sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 260px" priority={priority} onError={() => setFailed(true)} className="object-contain" />
      </Link>
      {badge ? <span className="store-badge">{badge}</span> : null}
      <FavoriteButton product={product} />
    </div>
    <div className="store-card-copy">
      <h3><Link href={`/catalogo?produto=${encodeURIComponent(product.slug)}`} scroll={false} onClick={onOpen}>{product.name}</Link></h3>
      <p className="store-card-brand">{product.brand.name}</p>
      <div className="store-card-price"><strong>{formatPrice(displayPrice)}</strong>{previousPrice > displayPrice ? <del>{formatPrice(previousPrice)}</del> : null}</div>
      {product.stock <= 0 ? <small className="store-reserve-label">Disponível por reserva</small> : null}
      {children}
    </div>
  </article>;
}
