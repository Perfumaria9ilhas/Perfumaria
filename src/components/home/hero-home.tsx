"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircleMore,
  ShieldCheck,
  Star,
  TestTubeDiagonal,
  Truck,
} from "lucide-react";
import type { PublicStoreSettings } from "@/lib/types";

const audienceCards = [
  {
    key: "MASCULINO",
    label: "Masculino",
    subtitle: "Fragrancias intensas e marcantes",
  },
  {
    key: "FEMININO",
    label: "Feminino",
    subtitle: "Perfumes elegantes e delicados",
  },
  {
    key: "UNISSEXO",
    label: "Unissexo",
    subtitle: "Versatilidade para todos os estilos",
  },
] as const;

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Perfumes 100% Originais",
    text: "Produtos autenticos",
  },
  {
    icon: Truck,
    title: "Entrega Rapida",
    text: "Ilha Terceira",
  },
  {
    icon: MessageCircleMore,
    title: "Apoio por WhatsApp",
    text: "Resposta proxima",
  },
  {
    icon: TestTubeDiagonal,
    title: "Decants 5ml",
    text: "Experimente primeiro",
  },
  {
    icon: Star,
    title: "Selecao Premium",
    text: "Escolha cuidada",
  },
  {
    icon: ShieldCheck,
    title: "Compra Segura",
    text: "Mais confianca",
  },
];

type HeroHomeProps = {
  settings: PublicStoreSettings;
};

export function HeroHome({ settings }: HeroHomeProps) {
  const slides = useMemo(
    () =>
      [
        {
          key: "MASCULINO",
          label: "Masculino",
          href: "/catalogo?audience=masculino",
          imageUrl: settings.heroMaleImageUrl,
        },
        {
          key: "FEMININO",
          label: "Feminino",
          href: "/catalogo?audience=feminino",
          imageUrl: settings.heroFemaleImageUrl,
        },
        {
          key: "UNISSEXO",
          label: "Unissexo",
          href: "/catalogo?audience=unissexo",
          imageUrl: settings.heroUnisexImageUrl,
        },
      ].filter((slide) => Boolean(slide.imageUrl)),
    [settings.heroFemaleImageUrl, settings.heroMaleImageUrl, settings.heroUnisexImageUrl],
  );

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = slides[activeSlideIndex] ?? null;

  function moveSlide(direction: "prev" | "next") {
    if (slides.length < 2) {
      return;
    }

    setActiveSlideIndex((current) => {
      if (direction === "prev") {
        return current === 0 ? slides.length - 1 : current - 1;
      }

      return current === slides.length - 1 ? 0 : current + 1;
    });
  }

  return (
    <section className="overflow-hidden rounded-[1.45rem] border border-[rgba(194,162,119,0.16)] bg-white shadow-[0_12px_28px_rgba(78,55,34,0.05)]">
      <div className="grid gap-0 lg:grid-cols-[0.36fr_0.64fr]">
        <div className="flex flex-col justify-between px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
          <div className="space-y-3">
            <div className="grid gap-2">
              {audienceCards.map((item) => (
                <Link
                  key={item.key}
                  href={`/catalogo?audience=${item.key.toLowerCase()}`}
                  className="flex items-center justify-between rounded-[0.95rem] border border-[rgba(194,162,119,0.16)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(249,242,232,0.98))] px-3.5 py-2.5 transition hover:border-[rgba(194,162,119,0.34)] hover:shadow-[0_8px_18px_rgba(78,55,34,0.06)]"
                >
                  <div>
                    <p className="font-serif text-[0.98rem] text-[color:var(--ink)]">{item.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-600">{item.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
                    Ver
                  </span>
                </Link>
              ))}
            </div>

            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-md bg-[linear-gradient(135deg,_#b88746,_#d0a260)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_10px_20px_rgba(184,135,70,0.16)] transition hover:translate-y-[-1px]"
            >
              Ver catalogo
            </Link>
          </div>

          <div className="mt-5 border-t border-[rgba(194,162,119,0.12)] pt-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-[rgba(194,162,119,0.24)]" />
              <h2 className="text-center text-[0.95rem] uppercase tracking-[0.14em] text-[color:var(--ink)]">
                Porque escolher
              </h2>
              <span className="h-px flex-1 bg-[rgba(194,162,119,0.24)]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {trustItems.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="flex flex-col items-center justify-start gap-1.5 px-1 py-1.5 text-center"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(194,162,119,0.2)] text-[color:var(--gold)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="text-[0.78rem] leading-tight text-[color:var(--ink)]">{item.title}</h3>
                    <p className="text-[10px] leading-4 text-slate-600">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(230,208,176,0.3),_transparent_48%),linear-gradient(180deg,_rgba(255,252,247,0.98),_rgba(244,229,208,0.98))] px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
          <div className="relative overflow-hidden rounded-[1.3rem] border border-[rgba(194,162,119,0.14)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,238,224,0.96))]">
            <div className="relative aspect-[16/10]">
              {activeSlide?.imageUrl ? (
                <Image
                  src={activeSlide.imageUrl}
                  alt={activeSlide.label}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/60 p-6">
                  <Image
                    src="/logo-9-ilhas.svg"
                    alt="9 Ilhas Perfumaria"
                    width={320}
                    height={120}
                    className="h-auto w-40 opacity-85"
                  />
                </div>
              )}

              {slides.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => moveSlide("prev")}
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[color:var(--ink)] shadow-[0_8px_18px_rgba(78,55,34,0.18)]"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide("next")}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[color:var(--ink)] shadow-[0_8px_18px_rgba(78,55,34,0.18)]"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {slides.length > 1 ? (
            <div className="mt-3 flex justify-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.key}
                  type="button"
                  onClick={() => setActiveSlideIndex(index)}
                  className={`h-2.5 rounded-full transition ${
                    index === activeSlideIndex ? "w-8 bg-[color:var(--gold)]" : "w-2.5 bg-[rgba(194,162,119,0.35)]"
                  }`}
                  aria-label={slide.label}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
