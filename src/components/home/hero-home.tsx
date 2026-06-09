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
      <div className="relative h-[420px] sm:h-[480px] md:h-[540px] lg:h-[580px] xl:h-[620px]">
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

        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />

        <div className="relative flex h-full flex-col justify-center px-6 py-8 pl-8 text-left text-white sm:px-8 sm:pl-10 lg:px-12 lg:pl-16 xl:pl-24">
          <div className="max-w-[520px]">
            <p className="mb-3 text-xs uppercase tracking-[0.34em] text-slate-100/80">
              Bem-vindo à 9 Ilhas
            </p>

            <h1 className="text-[2.4rem] leading-[0.95] text-white sm:text-[3rem] lg:text-[3.8rem]">
              {title}
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-100/85 sm:text-lg">
              {description}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
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

            <div className="mt-7 grid w-full gap-3 text-sm text-slate-100 sm:grid-cols-2">
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