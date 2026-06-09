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
  imageUrl,
}: HeroHomeProps) {
  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-[rgba(194,162,119,0.16)] bg-white shadow-[0_22px_48px_rgba(95,71,49,0.07)] sm:relative sm:rounded-[2.4rem]">
      <div className="relative h-[270px] sm:absolute sm:inset-0 sm:h-full">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            unoptimized
            priority
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="h-full w-full bg-slate-900/10" />
        )}

        <div className="absolute inset-0 hidden bg-gradient-to-r from-black/65 via-black/35 to-transparent sm:block" />
      </div>

      <div className="relative bg-[color:var(--sand-soft)] px-5 py-7 text-left sm:flex sm:h-[480px] sm:flex-col sm:justify-center sm:bg-transparent sm:px-8 sm:py-8 sm:pl-10 sm:text-white md:h-[540px] lg:h-[580px] lg:px-12 lg:pl-16 xl:h-[620px] xl:pl-24">
        <div className="max-w-[520px]">
          <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[color:var(--gold)] sm:mb-3 sm:text-xs sm:tracking-[0.34em] sm:text-slate-100/80">
            Bem-vindo à 9 Ilhas
          </p>

          <h1 className="text-[2.05rem] leading-[0.95] text-[color:var(--ink)] sm:text-[3rem] sm:text-white lg:text-[3.8rem]">
            {title}
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 sm:mt-5 sm:text-lg sm:leading-7 sm:text-slate-100/85">
            {description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-7 sm:gap-3">
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d2a35f)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(184,135,70,0.22)] transition hover:opacity-95 sm:px-6 sm:py-3"
            >
              {primaryButtonLabel}
            </Link>

            <Link
              href="/sobre-nos"
              className="inline-flex items-center justify-center rounded-full border border-[rgba(194,162,119,0.32)] bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] sm:border-white/25 sm:bg-white/10 sm:px-6 sm:py-3 sm:text-white sm:hover:border-white/40 sm:hover:text-white/90"
            >
              {secondaryButtonLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}