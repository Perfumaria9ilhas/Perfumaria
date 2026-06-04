"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <section className="bg-transparent">
      <div className="relative px-0 py-0">
        <div className="relative overflow-visible">
          <div className="relative aspect-[16/6.7] sm:aspect-[16/6.3]">
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
              <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-center justify-between px-3 md:px-4">
                <button
                  type="button"
                  onClick={() => moveSlide("prev")}
                  className="pointer-events-auto flex h-9 w-9 items-center justify-center text-white drop-shadow-[0_6px_16px_rgba(78,55,34,0.35)] transition hover:scale-105 md:rounded-full md:bg-white/90 md:text-[color:var(--ink)] md:shadow-[0_10px_22px_rgba(78,55,34,0.14)] md:drop-shadow-none animate-pulse md:animate-none"
                  aria-label="Slide anterior"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSlide("next")}
                  className="pointer-events-auto flex h-9 w-9 items-center justify-center text-white drop-shadow-[0_6px_16px_rgba(78,55,34,0.35)] transition hover:scale-105 md:rounded-full md:bg-white/90 md:text-[color:var(--ink)] md:shadow-[0_10px_22px_rgba(78,55,34,0.14)] md:drop-shadow-none animate-pulse md:animate-none"
                  aria-label="Slide seguinte"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : null}

            {activeSlide ? (
              <Link
                href={activeSlide.href}
                className="absolute bottom-3 left-1/2 z-20 inline-flex max-w-[calc(100%-2.5rem)] -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-full border border-[rgba(255,255,255,0.38)] bg-[rgba(73,46,24,0.9)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_14px_28px_rgba(73,46,24,0.3)] backdrop-blur-sm transition hover:bg-[rgba(73,46,24,0.96)] hover:text-white sm:max-w-none sm:px-5 sm:text-[11px] md:bottom-5 md:px-6 md:py-2.5"
              >
                Catálogo {activeSlide.label}
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
                  index === activeSlideIndex
                    ? "w-8 bg-[color:var(--gold)]"
                    : "w-2.5 bg-[rgba(194,162,119,0.35)]"
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
