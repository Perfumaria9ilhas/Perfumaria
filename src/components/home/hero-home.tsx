"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { PublicStoreSettings } from "@/lib/types";

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
    <section className="overflow-hidden rounded-[1.45rem] border border-[rgba(194,162,119,0.16)] bg-[radial-gradient(circle_at_top,_rgba(230,208,176,0.3),_transparent_48%),linear-gradient(180deg,_rgba(255,252,247,0.98),_rgba(244,229,208,0.98))] shadow-[0_12px_28px_rgba(78,55,34,0.05)]">
      <div className="relative overflow-hidden px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
          <div className="relative overflow-hidden rounded-[1.3rem] border border-[rgba(194,162,119,0.14)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,238,224,0.96))]">
            <div className="relative aspect-[16/7.2]">
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
            <div className="mt-2.5 flex justify-center gap-2">
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
    </section>
  );
}
