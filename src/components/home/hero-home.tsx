"use client";

import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct, PublicStoreSettings } from "@/lib/types";

type HeroHomeProps = {
  settings: PublicStoreSettings;
  products: CatalogProduct[];
};

type HeroVisual = {
  key: string;
  imageUrl: string;
  alt: string;
  label: string;
  size: "large" | "small";
};

function HeroVisualCard({ visual }: { visual: HeroVisual }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[2rem] border border-[rgba(194,162,119,0.18)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.88),_rgba(249,240,228,0.92))] shadow-[0_18px_38px_rgba(95,71,49,0.1)] ${
        visual.size === "large" ? "aspect-[1.08/1]" : "aspect-[1.06/0.86]"
      }`}
    >
      <Image
        src={visual.imageUrl}
        alt={visual.alt}
        fill
        unoptimized
        priority={visual.size === "large"}
        sizes={visual.size === "large" ? "(max-width: 1024px) 100vw, 42vw" : "(max-width: 1024px) 50vw, 20vw"}
        className="object-contain p-6 transition duration-500 group-hover:scale-[1.03]"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,_transparent,_rgba(255,248,240,0.85))]" />
      <span className="absolute left-4 top-4 rounded-full border border-[rgba(183,146,107,0.24)] bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--atlantic)] shadow-sm">
        {visual.label}
      </span>
    </div>
  );
}

export function HeroHome({ settings, products }: HeroHomeProps) {
  const fallbackProducts = products.slice(0, 3);

  const visuals: HeroVisual[] = [
    settings.heroMaleImageUrl
      ? {
          key: "male",
          imageUrl: settings.heroMaleImageUrl,
          alt: "Perfumes masculinos",
          label: "Masculino",
          size: "large",
        }
      : fallbackProducts[0]?.imageUrl
        ? {
            key: fallbackProducts[0].id,
            imageUrl: fallbackProducts[0].imageUrl,
            alt: fallbackProducts[0].name,
            label: fallbackProducts[0].brand.name,
            size: "large",
          }
        : null,
    settings.heroFemaleImageUrl
      ? {
          key: "female",
          imageUrl: settings.heroFemaleImageUrl,
          alt: "Perfumes femininos",
          label: "Feminino",
          size: "small",
        }
      : fallbackProducts[1]?.imageUrl
        ? {
            key: fallbackProducts[1].id,
            imageUrl: fallbackProducts[1].imageUrl,
            alt: fallbackProducts[1].name,
            label: fallbackProducts[1].brand.name,
            size: "small",
          }
        : null,
    settings.heroUnisexImageUrl
      ? {
          key: "unisex",
          imageUrl: settings.heroUnisexImageUrl,
          alt: "Perfumes unissexo",
          label: "Unissexo",
          size: "small",
        }
      : fallbackProducts[2]?.imageUrl
        ? {
            key: fallbackProducts[2].id,
            imageUrl: fallbackProducts[2].imageUrl,
            alt: fallbackProducts[2].name,
            label: fallbackProducts[2].brand.name,
            size: "small",
          }
        : null,
  ].filter((item): item is HeroVisual => Boolean(item));

  return (
    <section className="grid gap-6 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
      <div className="space-y-6 rounded-[2.4rem] bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(249,242,232,0.94))] p-7 shadow-[0_24px_54px_rgba(95,71,49,0.08)] sm:p-9 lg:p-10">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
            Bem-vindo à 9 Ilhas
          </p>
          <h1 className="max-w-[12ch] text-[2.65rem] leading-[0.92] text-[color:var(--ink)] sm:text-[3.6rem] lg:text-[4.3rem]">
            Perfumes Árabes Originais
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Fragrâncias selecionadas com entrega rápida na Ilha Terceira e envios
            para Açores, Madeira e Portugal Continental.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d2a35f)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(184,135,70,0.22)] transition hover:opacity-95"
          >
            Ver Catálogo
          </Link>
          <Link
            href="/sobre-nos"
            className="inline-flex items-center justify-center rounded-full border border-[rgba(183,146,107,0.28)] bg-white px-6 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
          >
            Sobre Nós
          </Link>
        </div>

        <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          {[
            "Perfumes 100% Originais",
            "Entrega rápida na Ilha Terceira",
            "Atendimento personalizado por WhatsApp",
            "Amostras disponíveis em 5ml",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-[1.3rem] border border-[rgba(194,162,119,0.18)] bg-white/78 px-4 py-3"
            >
              <span className="text-[color:var(--gold)]">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
        {visuals[0] ? <HeroVisualCard visual={visuals[0]} /> : null}
        <div className="grid gap-4">
          {visuals.slice(1, 3).map((visual) => (
            <HeroVisualCard key={visual.key} visual={visual} />
          ))}
          {!visuals.length ? (
            <div className="flex min-h-[18rem] items-center justify-center rounded-[2rem] border border-[rgba(194,162,119,0.18)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.88),_rgba(249,240,228,0.92))] p-6 shadow-[0_18px_38px_rgba(95,71,49,0.1)]">
              <Image
                src="/logo-9-ilhas.svg"
                alt="9 Ilhas Perfumaria"
                width={280}
                height={80}
                className="h-auto w-44 opacity-85"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
