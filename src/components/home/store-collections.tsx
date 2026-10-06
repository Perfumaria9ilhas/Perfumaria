import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, FlaskConical, MessageCircle, Truck } from "lucide-react";
import type { HomepageEditorConfig } from "@/lib/homepage-config";
export function CollectionRail({config}:{config:HomepageEditorConfig["collections"]}) {
 const items=config.items.filter(c=>c.active&&c.title&&c.href).sort((a,b)=>a.order-b.order);
 return items.length?<nav aria-label="Explorar coleções" className="store-collection-rail">{items.map(c=><Link key={c.key} href={c.href}><span>{c.imageUrl?<Image src={c.imageUrl} alt="" fill unoptimized sizes="100px" className="object-contain"/>:<FlaskConical/>}</span><strong>{c.title}</strong></Link>)}</nav>:null;
}
export function CollectionPromos({config}:{config:HomepageEditorConfig["promos"]}) {
 const items=config.items.filter(c=>c.active&&(c.title||c.text||c.imageUrl)).sort((a,b)=>a.order-b.order);
 return items.length?<section className="store-promo-grid" aria-label="Descobrir mais">{items.map(c=>{const content=<><div>{c.title?<h2>{c.title}</h2>:null}{c.text?<p>{c.text}</p>:null}{c.buttonLabel&&c.href?<span>{c.buttonLabel}<ArrowRight size={16}/></span>:null}</div>{c.imageUrl?<div className="store-promo-photo"><Image src={c.imageUrl} alt={c.title} fill unoptimized sizes="160px" className="object-contain"/></div>:null}</>;return c.href?<Link key={c.key} href={c.href} className="store-promo">{content}</Link>:<article key={c.key} className="store-promo">{content}</article>;})}</section>:null;
}
export function StoreTrustPoints({config}:{config:HomepageEditorConfig["trust"]}) {
 const icons=[BadgeCheck,FlaskConical,Truck,MessageCircle];const items=config.items.filter(b=>b.title||b.text);
 return items.length?<section className="store-trust-points" aria-label="Comprar com confiança">{items.map((b,i)=>{const Icon=icons[i%icons.length];return <div key={i}><Icon size={23}/><span>{b.title?<strong>{b.title}</strong>:null}{b.text?<small>{b.text}</small>:null}</span></div>;})}</section>:null;
}
