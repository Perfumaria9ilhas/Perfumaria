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
        <div className="flex h-full flex-col justify-center px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
          <div className="rounded-[1.2rem] border border-[rgba(194,162,119,0.12)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(249,242,232,0.7))] px-4 py-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-[rgba(194,162,119,0.24)]" />
              <h2 className="text-center text-[0.95rem] uppercase tracking-[0.14em] text-[color:var(--ink)]">
                Porque nos escolher?
              </h2>
              <span className="h-px flex-1 bg-[rgba(194,162,119,0.24)]" />
            </div>

            <div className="grid gap-y-4 sm:grid-cols-3 sm:gap-x-3">
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
                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-[color:var(--ink)] shadow-[0_10px_22px_rgba(78,55,34,0.22)] transition hover:scale-105"
                    aria-label="Slide anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide("next")}
                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-[color:var(--ink)] shadow-[0_10px_22px_rgba(78,55,34,0.22)] transition hover:scale-105"
                    aria-label="Slide seguinte"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}

              {activeSlide ? (
                <Link
                  href={activeSlide.href}
                  className="absolute bottom-4 left-4 z-20 inline-flex items-center rounded-full bg-[rgba(255,255,255,0.94)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink)] shadow-[0_10px_22px_rgba(78,55,34,0.18)] transition hover:text-[color:var(--gold)]"
                >
                  Perfumes {activeSlide.label}
                </Link>
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
