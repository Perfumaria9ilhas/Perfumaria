"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicStoreSettings } from "@/lib/types";

export function HeroHome({ settings }: { settings: PublicStoreSettings }) {
  const heroSlides = settings.heroSlides
    .filter((slide) => Boolean(slide.imageUrl))
    .map((slide) => ({
      imageUrl: slide.imageUrl,
      durationSeconds: slide.durationSeconds ?? 4,
    }));
  const slides =
    heroSlides.length > 0
      ? heroSlides
      : settings.heroImageUrl
        ? [{ imageUrl: settings.heroImageUrl, durationSeconds: 4 }]
        : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [openedSlideIndex, setOpenedSlideIndex] = useState<number | null>(null);
  const currentIndex = slides.length > 0 ? activeIndex % slides.length : 0;
  const currentSlide = slides[currentIndex];
  const openedSlide =
    openedSlideIndex !== null && slides[openedSlideIndex]
      ? slides[openedSlideIndex]
      : null;

  function goToPreviousSlide() {
    if (openedSlideIndex !== null) {
      setOpenedSlideIndex((current) =>
        current === null ? 0 : (current - 1 + slides.length) % slides.length,
      );
      return;
    }

    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  function goToNextSlide() {
    if (openedSlideIndex !== null) {
      setOpenedSlideIndex((current) =>
        current === null ? 0 : (current + 1) % slides.length,
      );
      return;
    }

    setActiveIndex((current) => (current + 1) % slides.length);
  }

  useEffect(() => {
    if (slides.length <= 1 || openedSlideIndex !== null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, Math.max(1, currentSlide?.durationSeconds ?? 4) * 1000);

    return () => window.clearTimeout(timer);
  }, [currentIndex, currentSlide?.durationSeconds, openedSlideIndex, slides.length]);

  return (
    <>
      {openedSlide ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,18,10,0.78)] px-4 py-6"
          onClick={() => setOpenedSlideIndex(null)}
        >
          <div
            className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,_rgba(255,252,247,0.98),_rgba(247,239,227,0.98))] p-3 shadow-[0_28px_90px_rgba(28,18,10,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpenedSlideIndex(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/92 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink)] shadow-sm"
            >
              Fechar
            </button>
            {slides.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={goToPreviousSlide}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-3 text-[color:var(--ink)] shadow-[0_10px_25px_rgba(28,18,10,0.18)] transition hover:bg-white"
                  aria-label="Banner anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goToNextSlide}
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-3 text-[color:var(--ink)] shadow-[0_10px_25px_rgba(28,18,10,0.18)] transition hover:bg-white"
                  aria-label="Próximo banner"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}
            <div className="relative aspect-[16/10] max-h-[82svh] w-full sm:aspect-[16/9]">
              <Image
                src={openedSlide.imageUrl}
                alt="Imagem ampliada do banner da 9 Ilhas Perfumaria"
                fill
                unoptimized
                className="scale-[1.02] object-contain transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      ) : null}

      <section className="relative overflow-hidden rounded-[1.8rem] shadow-[0_16px_40px_rgba(74,51,32,0.08)]">
        <div className="relative mx-auto w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[2.55/1] xl:aspect-[2.7/1]">
          {currentSlide ? (
            <div className="relative h-full w-full overflow-hidden rounded-[1.8rem] bg-[color:var(--sand-soft)]">
              <button
                type="button"
                onClick={() => setOpenedSlideIndex(currentIndex)}
                className="absolute inset-0 z-10 cursor-zoom-in touch-manipulation"
                aria-label={`Abrir banner ${currentIndex + 1}`}
              >
                <div className="relative h-full w-full">
                  <Image
                    src={currentSlide.imageUrl}
                    alt={`Banner ${currentIndex + 1} da 9 Ilhas Perfumaria`}
                    fill
                    unoptimized
                    priority={currentIndex === 0}
                    className="object-contain"
                  />
                </div>
              </button>

              {slides.length > 1 ? (
                <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur">
                  {slides.map((slide, index) => (
                    <button
                      key={`${slide.imageUrl}-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentIndex
                          ? "w-6 bg-[color:var(--gold)]"
                          : "w-2 bg-[rgba(166,133,96,0.35)]"
                      }`}
                      aria-label={`Ver slide ${index + 1}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-[2rem] bg-[linear-gradient(135deg,_#a6815d,_#d5b38a)] text-sm uppercase tracking-[0.35em] text-white/75">
              9 Ilhas Perfumaria
            </div>
          )}
        </div>
      </section>
    </>
  );
}
