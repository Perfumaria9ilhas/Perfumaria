import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, FlaskConical, MessageCircle, Truck } from "lucide-react";
import type { StoreCollection } from "@/lib/store-collections";

export function CollectionRail({ collections }: { collections: StoreCollection[] }) {
  return <nav aria-label="Explorar coleções" className="store-collection-rail">{collections.map((collection) => <Link key={collection.key} href={collection.href}><span>{collection.imageUrl ? <Image src={collection.imageUrl} alt="" fill sizes="80px" className="object-contain" /> : <FlaskConical />}</span><strong>{collection.label}</strong></Link>)}</nav>;
}
export function CollectionPromos({ collections }: { collections: StoreCollection[] }) {
  const promos = collections.filter((collection) => collection.kind === "decants" || /ambient|pasta|corpo/i.test(collection.slug)).slice(0, 3);
  return promos.length ? <section className="store-promo-grid" aria-label="Descobrir mais">{promos.map((collection) => <Link key={collection.key} href={collection.href} className="store-promo"><div><h2>{collection.label}</h2><p>{collection.kind === "decants" ? "Experimente novos aromas antes de escolher." : /ambient/i.test(collection.slug) ? "Aroma para a sua casa." : "Descubra a nossa seleção para o corpo."}</p><span>Explorar <ArrowRight size={16} /></span></div>{collection.imageUrl ? <div className="store-promo-photo"><Image src={collection.imageUrl} alt={collection.label} fill sizes="160px" className="object-contain" /></div> : null}</Link>)}</section> : null;
}
export function StoreTrustPoints() {
  return <section className="store-trust-points" aria-label="Comprar com confiança">{[{ icon: BadgeCheck, title: "Produtos originais", text: "Marcas de confiança" }, { icon: FlaskConical, title: "Decants 5 ml e 10 ml", text: "Em perfumes selecionados" }, { icon: Truck, title: "Entregas na Ilha Terceira", text: "Envios para todo o país" }, { icon: MessageCircle, title: "Apoio próximo", text: "Fale connosco por WhatsApp" }].map(({ icon: Icon, title, text }) => <div key={title}><Icon size={23} /><span><strong>{title}</strong><small>{text}</small></span></div>)}</section>;
}
