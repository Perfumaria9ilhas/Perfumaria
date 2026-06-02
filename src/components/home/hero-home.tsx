"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, MessageCircleMore, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicStoreSettings } from "@/lib/types";

const heroPoints = [
  "Perfumes 100% Originais",
  "Entrega rápida na Ilha Terceira",
  "Atendimento personalizado por WhatsApp",
  "Amostras disponíveis em 5ml",
];

const heroTrust = [
  {
    icon: ShieldCheck,
    label: "Originais verificados",
  },
  {
    icon: Truck,
    label: "Entrega local rápida",
  },
  {
    icon: MessageCircleMore,
    label: "Apoio por WhatsApp",
  },
  {
    icon: Sparkles,
    label: "Decants 5ml",
  },
];

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
    if (slides.length < 2) {
      return;
    }

    if (openedSlideIndex !== null) {
      setOpenedSlideIndex((current) =>
        current === null ? 0 : (current - 1 + slides.length) % slides.length,
      );
      return;
    }

    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  function goToNextSlide() {
    if (slides.length < 2) {
      return;
    }

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

      <section className="grid gap-5 lg:grid-cols-[1.02fr_1.18fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(185,154,118,0.2)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.97),_rgba(248,238,225,0.94))] p-6 shadow-[0_18px_46px_rgba(74,51,32,0.08)] sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(212,180,137,0.24),_transparent_70%)]" />
          <div className="relative space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
                Perfumaria 9 Ilhas
              </p>
              <h1 className="max-w-[12ch] font-serif text-4xl leading-[0.98] text-[color:var(--ink)] sm:text-5xl lg:text-[3.85rem]">
                Perfumes originais com entrega próxima e confiança real.
              </h1>
              <p className="max-w-xl text-base leading-8 text-slate-600">
                Seleção cuidada de perfumes árabes para quem procura autenticidade, apoio humano e
                uma experiência mais segura desde o primeiro contacto.
              </p>
            </div>

            <div className="grid gap-3">
              {heroPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-3 rounded-[1.15rem] border border-[rgba(185,154,118,0.18)] bg-white/76 px-4 py-3 text-sm font-medium text-[color:var(--ink)] shadow-[0_10px_24px_rgba(74,51,32,0.05)]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                    <Check className="h-4 w-4" />
                  </span>
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(184,135,70,0.24)] transition hover:translate-y-[-1px]"
              >
                Ver catálogo
              </Link>
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-6 py-3.5 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
              >
                Falar por WhatsApp
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {heroTrust.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-[1.2rem] border border-[rgba(185,154,118,0.14)] bg-[rgba(255,250,243,0.8)] px-4 py-4"
                  >
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="text-sm leading-6 text-[color:var(--ink)]">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(185,154,118,0.2)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.97),_rgba(248,238,225,0.94))] p-4 shadow-[0_18px_46px_rgba(74,51,32,0.08)]">
          <div className="relative mx-auto w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[1.48/1] xl:aspect-[1.62/1]">
            {currentSlide ? (
              <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] bg-[color:var(--sand-soft)]">
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
                      className="object-cover"
                    />
                  </div>
                </button>

                {slides.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={goToPreviousSlide}
                      className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/88 p-2.5 text-[color:var(--ink)] shadow-[0_10px_22px_rgba(28,18,10,0.14)] transition hover:bg-white"
                      aria-label="Banner anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextSlide}
                      className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/88 p-2.5 text-[color:var(--ink)] shadow-[0_10px_22px_rgba(28,18,10,0.14)] transition hover:bg-white"
                      aria-label="Próximo banner"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/82 px-3 py-1.5 shadow-sm backdrop-blur">
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
                  </>
                ) : null}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[1.6rem] bg-[linear-gradient(135deg,_#a6815d,_#d5b38a)] text-sm uppercase tracking-[0.35em] text-white/75">
                9 Ilhas Perfumaria
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
