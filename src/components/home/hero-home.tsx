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
    <section className="overflow-hidden rounded-[1.25rem] border border-[rgba(170,128,83,0.16)] bg-white shadow-[0_20px_60px_rgba(50,37,28,0.08)] sm:relative sm:rounded-[1.8rem]">
      <div className="relative h-[230px] sm:absolute sm:inset-0 sm:h-full">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            unoptimized
            priority
            className="h-full w-full scale-[1.08] object-cover object-[center_74%] sm:scale-[1.14] sm:object-[center_72%]"
          />
        ) : (
          <div className="h-full w-full bg-slate-900/10" />
        )}

        <div className="absolute inset-0 hidden bg-gradient-to-r from-black/72 via-black/38 to-black/5 sm:block" />
      </div>

      <div className="relative bg-white px-5 py-6 text-left sm:flex sm:h-[500px] sm:flex-col sm:justify-center sm:bg-transparent sm:px-10 sm:py-10 sm:text-white lg:h-[560px] lg:px-16 xl:h-[590px] xl:px-20">
        <div className="max-w-[520px]">
          <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[color:var(--gold)] sm:mb-3 sm:text-xs sm:tracking-[0.34em] sm:text-slate-100/80">
            {"Bem-vindo \u00e0 9 Ilhas"}
          </p>

          <h1 className="text-[2rem] leading-[0.98] text-[color:var(--ink)] sm:text-[3.4rem] sm:text-white lg:text-[4.35rem]">
            {title}
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 sm:mt-5 sm:text-lg sm:leading-7 sm:text-slate-100/85">
            {description}
          </p>

          <p className="mt-3 max-w-lg text-xs font-medium leading-5 text-[color:var(--atlantic)] sm:text-sm sm:text-white/90">
            Escolha os seus perfumes e finalize a encomenda pelo WhatsApp.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-7 sm:gap-3">
            <Link
              href="/catalogo"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--gold)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(78,54,34,0.2)] transition hover:bg-[color:#967047]"
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
