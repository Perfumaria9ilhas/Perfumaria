"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, LockKeyhole, LogOut, Mail, MapPin, MessageCircle, Pencil, Phone, Tag, UserRound, X } from "lucide-react";
import { logoutCustomer } from "@/actions/admin";
import { useFavorites } from "@/components/providers/favorites-provider";
import { AccountDeletionRequest } from "@/components/store/account-deletion-request";
import { PublicDialog } from "@/components/store/public-dialog";
import { formatPrice, getSalePriceInCents } from "@/lib/format";
import type { CatalogProduct } from "@/lib/types";
type Profile = { firstName: string; lastName: string; email: string; phone: string; address: string; deletionRequested: boolean };
function OfferPhoto({ product }: { product: CatalogProduct }) {
  const [failed, setFailed] = useState(false);
  return <Image src={!product.imageUrl || failed ? "/logo-9-ilhas.svg" : product.imageUrl} alt={product.name} fill sizes="(max-width: 767px) 160px, 230px" className="object-contain" onError={() => setFailed(true)} />;
}
export function CustomerAccount({ profile: initial, promotions, whatsappNumber }: { profile: Profile; promotions: CatalogProduct[]; whatsappNumber: string }) {
  const [profile, setProfile] = useState(initial); const [mode, setMode] = useState<"profile" | "password" | "promotions" | null>(null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [success, setSuccess] = useState("");
  const favorites = useFavorites(); const whatsapp = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`;
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError("");
    const body = mode === "profile" ? { action: "PROFILE", firstName: form.get("firstName"), lastName: form.get("lastName"), phone: form.get("phone"), address: form.get("address") } : { action: "PASSWORD", currentPassword: form.get("currentPassword"), password: form.get("password"), confirmation: form.get("confirmation") };
    try {
      const res = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      if (body.action === "PROFILE") setProfile({ ...profile, firstName: String(form.get("firstName")), lastName: String(form.get("lastName")), phone: String(form.get("phone")), address: String(form.get("address")) });
      setSuccess(mode === "profile" ? "Dados atualizados com sucesso." : "Palavra-passe alterada com sucesso."); setMode(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível guardar."); } finally { setBusy(false); }
  }
  const cards = [
    { title: "Os meus dados", text: "Ver e editar", icon: UserRound, action: () => document.getElementById("account-data")?.scrollIntoView({ behavior: "smooth", block: "center" }) },
    { title: "Favoritos", text: "Os seus perfumes", icon: Heart, action: favorites.open },
    { title: "Descontos e promoções", text: "Ver ofertas", icon: Tag, action: () => document.getElementById("account-offers")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
  ];
  const offerCard = (p: CatalogProduct) => <article className="account-offer" key={p.id}><div className="account-offer-photo"><span>−{new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 1 }).format((1 - getSalePriceInCents(p) / p.priceInCents) * 100)}%</span><Link href={`/catalogo?produto=${encodeURIComponent(p.slug)}`}><OfferPhoto product={p} /></Link></div><div className="account-offer-copy"><small>{p.brand.name}</small><h3>{p.name}</h3><del>{formatPrice(p.priceInCents)}</del><strong>{formatPrice(getSalePriceInCents(p))}</strong><Link className="account-gold-button" href={`/catalogo?produto=${encodeURIComponent(p.slug)}`}>Ver produto</Link></div></article>;
  return <div className="customer-account">
    <header className="account-page-heading"><h1>A minha conta</h1><p><Link href="/">Início</Link><span>/</span>A minha conta</p></header>
    <section className="account-welcome"><div className="account-avatar">{profile.firstName.charAt(0).toLocaleUpperCase("pt-PT")}</div><div><h2>Olá, {profile.firstName}!</h2><p>Bem-vindo à sua conta na Perfumaria 9 Ilhas.</p><p className="account-welcome-extra">Aqui pode gerir os seus dados, ver as promoções e guardar os seus favoritos.</p></div><svg viewBox="0 0 180 160" aria-hidden="true" className="account-leaves"><path d="M170 160 Q80 60 85 0 M170 160 Q110 85 10 90" fill="none" stroke="#c4ad86" strokeWidth="2" />{[0,1,2,3,4].map(i => <g key={i} transform={`translate(${80+i*14},${i*28}) rotate(${-35+i*8})`}><ellipse cx="-14" cy="12" rx="11" ry="25" fill="#d9c9ad" opacity=".5" /><ellipse cx="15" cy="22" rx="10" ry="26" fill="#e8ddca" opacity=".8" /></g>)}</svg></section>
    <nav className="account-shortcuts" aria-label="Atalhos da conta">{cards.map(({ title, text, icon: Icon, action }) => <button key={title} onClick={action}><Icon /><strong>{title}</strong><small>{text}</small><ArrowRight size={16} /></button>)}<a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle /><strong>Contactar a loja</strong><small>Fale connosco</small><ArrowRight size={16} /></a></nav>
    {success && <p role="status" className="account-success">{success}</p>}
    <section id="account-offers" className="account-panel"><div className="account-section-heading"><h2>Descontos e promoções</h2><button onClick={() => setMode("promotions")}>Ver todos <ArrowRight size={16} /></button></div><p className="account-muted">Descubra os perfumes que estão com preços especiais.</p>{promotions.length ? <div className="account-offer-carousel">{promotions.slice(0,4).map(offerCard)}</div> : <p className="account-empty">Neste momento não existem promoções ativas. Explore o catálogo para descobrir a nossa seleção.</p>}</section>
    <div className="account-detail-grid"><section id="account-data" className="account-panel"><div className="account-section-heading"><h2>Os meus dados</h2><button onClick={() => { setError(""); setMode("profile"); }}><Pencil size={15} />Editar</button></div><dl className="account-data-list">{[{ label: "Nome", value: `${profile.firstName} ${profile.lastName}`, icon: UserRound }, { label: "Email", value: profile.email, icon: Mail }, { label: "Telefone", value: profile.phone, icon: Phone }, { label: "Morada", value: profile.address, icon: MapPin }].map(({ label, value, icon: Icon }) => <div key={label}><Icon /><div><dt>{label}</dt><dd>{value}</dd></div></div>)}</dl></section>
    <section className="account-panel"><h2>Segurança</h2><button className="account-security-row" onClick={() => { setError(""); setMode("password"); }}><LockKeyhole /><span><strong>Alterar palavra-passe</strong><small>Mantenha a sua conta segura.</small></span><ArrowRight size={16} /></button><AccountDeletionRequest requested={profile.deletionRequested} /><form action={logoutCustomer}><button className="account-security-row account-logout"><LogOut /><span><strong>Terminar sessão</strong><small>Sair da sua conta.</small></span><ArrowRight size={16} /></button></form></section></div>
    <aside className="account-help"><MessageCircle /><div><h2>Precisa de ajuda?</h2><p>Estamos aqui para si. Fale connosco através do WhatsApp.</p></div><a href={whatsapp} target="_blank" rel="noreferrer" className="account-gold-button">Contactar a loja <ArrowRight size={16} /></a></aside>
    <PublicDialog open={mode !== null} onClose={() => { if (!busy) setMode(null); }} title={mode === "profile" ? "Editar os meus dados" : mode === "password" ? "Alterar palavra-passe" : "Todas as promoções"} className="account-dialog"><button className="store-icon store-dialog-close" aria-label="Fechar" disabled={busy} onClick={() => setMode(null)}><X size={20} /></button>{mode === "promotions" ? <div className="account-all-offers">{promotions.length ? promotions.map(offerCard) : <p>Não existem promoções ativas neste momento.</p>}</div> : <form className="account-edit-form" onSubmit={save}>{mode === "profile" ? <>{[{ name: "firstName", label: "Primeiro nome", value: profile.firstName }, { name: "lastName", label: "Último nome", value: profile.lastName }, { name: "phone", label: "Telefone", value: profile.phone }].map(f => <label key={f.name}>{f.label}<input name={f.name} defaultValue={f.value} required minLength={f.name === "phone" ? 6 : 2} maxLength={f.name === "phone" ? 40 : 100} /></label>)}<label>Morada<textarea name="address" defaultValue={profile.address} required minLength={6} maxLength={1000} /></label><p className="account-muted">Email: {profile.email}. Contacte a loja se precisar de o alterar.</p></> : <>{[{ name: "currentPassword", label: "Palavra-passe atual" }, { name: "password", label: "Nova palavra-passe" }, { name: "confirmation", label: "Confirmar nova palavra-passe" }].map(f => <label key={f.name}>{f.label}<input type="password" name={f.name} required minLength={6} maxLength={72} autoComplete={f.name === "currentPassword" ? "current-password" : "new-password"} /></label>)}</>}{error && <p role="alert" className="text-red-700">{error}</p>}<div className="flex gap-3"><button disabled={busy} type="button" onClick={() => setMode(null)}>Cancelar</button><button disabled={busy} className="account-gold-button">{busy ? "A guardar…" : "Guardar alterações"}</button></div></form>}</PublicDialog>
  </div>;
}
