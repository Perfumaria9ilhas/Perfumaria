import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CreditCard, MapPin, Truck } from "lucide-react";
import type { HomepageEditorConfig } from "@/lib/homepage-config";
export function HeroHome({config}:{config:HomepageEditorConfig["hero"]}) {
 const icons=[MapPin,Truck,CreditCard];const hasCopy=Boolean(config.title||config.text||config.eyebrow||(config.buttonLabel&&config.href));
 if(!hasCopy&&!config.imageUrl&&!config.benefitsActive)return null;
 return <section className={`store-hero ${!config.imageUrl?"store-hero-no-image":""} ${!hasCopy?"store-hero-no-copy":""}`}>
 {hasCopy?<div className="store-hero-copy">{config.eyebrow?<p className="store-eyebrow">{config.eyebrow}</p>:null}{config.title?<h1>{config.title}</h1>:null}{config.text?<p className="store-hero-description">{config.text}</p>:null}{config.buttonLabel&&config.href?<Link href={config.href} className="store-button">{config.buttonLabel}<ArrowRight size={18}/></Link>:null}</div>:null}
 {config.imageUrl?<div className="store-hero-image"><Image src={config.imageUrl} alt={config.title||"Perfumaria 9 Ilhas"} fill priority unoptimized sizes="(max-width: 767px) 100vw, 800px" className="object-contain"/></div>:null}
 {config.benefitsActive&&config.benefits.some(b=>b.title||b.text)?<div className="store-hero-benefits">{config.benefits.filter(b=>b.title||b.text).map((b,i)=>{const Icon=icons[i%icons.length];return <div key={i}><Icon/><span>{b.title?<strong>{b.title}</strong>:null}{b.text?<small>{b.text}</small>:null}</span></div>;})}</div>:null}
 </section>;
}
