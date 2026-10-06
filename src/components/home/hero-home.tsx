import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CreditCard, MapPin, Truck } from "lucide-react";
export function HeroHome({ title, description, primaryButtonLabel, imageUrl }: {
 title: string; description: string; primaryButtonLabel: string; secondaryButtonLabel: string; benefits: string[]; imageUrl?: string | null;
}) {
 return <section className="store-hero">
 <div className="store-hero-copy"><p className="store-eyebrow">Bem-vindo à 9 Ilhas</p><h1>{title}</h1><p className="store-hero-description">{description}</p><Link href="/catalogo" className="store-button">{primaryButtonLabel}<ArrowRight size={18} /></Link></div>
 <div className="store-hero-image">{imageUrl ? <Image src={imageUrl} alt={title} fill priority sizes="(max-width: 767px) 100vw, 800px" className="object-contain" /> : <div className="store-hero-placeholder">9 Ilhas · Perfumaria</div>}</div>
 <div className="store-hero-benefits">
 <div><MapPin /><span><strong>Entrega em mão</strong><small>Ilha Terceira</small></span></div>
 <div><Truck /><span><strong>Envios CTT</strong><small>Açores, Madeira e Continente</small></span></div>
 <div><CreditCard /><span><strong>Pagamento</strong><small>MBWay ou transferência</small></span></div>
 </div></section>;
}
