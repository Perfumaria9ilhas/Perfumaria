"use client";

import Image from "next/image";
import Link from "next/link";

type HeroHomeProps = {
  title: string;
  description: string;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  benefits: string[];
  imageUrl?: string | null;
};

export function HeroHome({
  title,
  description,
  primaryButtonLabel,
  secondaryButtonLabel,
  benefits,
  imageUrl,
}: HeroHomeProps) {
  return (
    <section className="relative overflow-hidden rounded-[2.4rem] border border-[rgba(194,162,119,0.16)] shadow-[0_22px_48px_rgba(95,71,49,0.07)]">
      <div className="relative h-[500px] sm:h-[560px] md:h-[620px] lg:h-[680px] xl:h-[740px]">
        {imageUrl ? (
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt={title}
              fill
              unoptimized
              priority
              className="h-full w-full object-cover object-center"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-slate-900/10" />
        )}

        <div className="absolute inset-0 bg-slate-950/35" />

        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-6 py-10 text-left text-white sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs uppercase tracking-[0.34em] text-slate-100/80">
              Bem-vindo à 9 Ilhas
            </p>

            <h1 className="text-[2.8rem] leading-[0.94] text-white sm:text-[3.5rem] lg:text-[4.35rem]">
              {title}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-100/85 sm:text-lg">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d2a35f)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(184,135,70,0.22)] transition hover:opacity-95"
              >
                {primaryButtonLabel}
              </Link>
              <Link
                href="/sobre-nos"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:text-white/90"
              >
                {secondaryButtonLabel}
              </Link>
            </div>

            <div className="mt-8 grid w-full gap-3 text-sm text-slate-100 sm:grid-cols-2">
              {benefits.filter(Boolean).map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[1.25rem] border border-white/15 bg-slate-950/40 px-4 py-3 backdrop-blur"
                >
                  <span className="text-[color:var(--gold)]">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
