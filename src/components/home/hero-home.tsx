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
    <section className="relative sm:overflow-hidden sm:rounded-[1.8rem] sm:border sm:border-[rgba(170,128,83,0.16)] sm:bg-white sm:shadow-[0_20px_60px_rgba(50,37,28,0.08)]">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[0.9rem] bg-[color:#f8f3ec] sm:absolute sm:inset-0 sm:h-full sm:rounded-none">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            unoptimized
            priority
            className="h-full w-full object-contain object-center sm:scale-100 sm:object-cover sm:object-center"
          />
        ) : (
          <div className="h-full w-full bg-slate-900/10" />
        )}

        <div className="absolute inset-0 hidden bg-gradient-to-r from-black/72 via-black/38 to-black/5 sm:block" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 via-black/12 to-transparent sm:hidden" />
        <p className="absolute bottom-3 left-4 text-[9px] font-medium uppercase tracking-[0.22em] text-white drop-shadow-sm sm:hidden">
          {"Bem-vindo \u00e0 9 Ilhas"}
        </p>
      </div>

      <div className="hidden text-white sm:relative sm:flex sm:h-[500px] sm:flex-col sm:justify-center sm:bg-transparent sm:px-10 sm:py-10 sm:text-left lg:h-[560px] lg:px-16 xl:h-[590px] xl:px-20">
        <div className="max-w-[520px]">
          <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.22em] text-white drop-shadow-sm sm:mb-3 sm:text-xs sm:tracking-[0.34em] sm:text-slate-100/80">
            {"Bem-vindo \u00e0 9 Ilhas"}
          </p>

          <h1 className="sr-only">
            {title}
          </h1>

          <p className="sr-only">
            {description}
          </p>

          <p className="sr-only">
            Escolha os seus perfumes e finalize a encomenda pelo WhatsApp.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[color:var(--gold)] px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(20,15,10,0.25)] transition hover:bg-[color:#967047] sm:min-h-12 sm:px-6 sm:py-3 sm:text-sm"
            >
              {primaryButtonLabel}
            </Link>

            <Link
              href="/sobre-nos"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/70 bg-white/90 px-3 py-2 text-xs font-semibold text-[color:var(--ink)] backdrop-blur-sm transition hover:border-white sm:min-h-11 sm:border-white/25 sm:bg-white/10 sm:px-6 sm:py-3 sm:text-sm sm:text-white sm:hover:border-white/40 sm:hover:text-white/90"
            >
              {secondaryButtonLabel}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
        <Link
          href="/catalogo"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--gold)] px-3 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(78,54,34,0.14)] transition hover:bg-[color:#967047]"
        >
          {primaryButtonLabel}
        </Link>
        <Link
          href="/sobre-nos"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-3 py-2.5 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)]"
        >
          {secondaryButtonLabel}
        </Link>
      </div>
    </section>
  );
}
