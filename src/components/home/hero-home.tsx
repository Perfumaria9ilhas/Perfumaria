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
    <section className="overflow-hidden rounded-[2.4rem] border border-[rgba(194,162,119,0.16)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(249,242,232,0.95))] px-6 py-10 shadow-[0_22px_48px_rgba(95,71,49,0.07)] sm:px-8 sm:py-12 lg:px-12 lg:py-14">
      <div
        className={`mx-auto grid items-center gap-8 ${
          imageUrl ? "max-w-6xl lg:grid-cols-[0.86fr_1.14fr]" : "max-w-4xl"
        }`}
      >
        <div className="flex flex-col items-start gap-6 text-left">
          <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
            Bem-vindo à 9 Ilhas
          </p>

          <div className="space-y-4">
            <h1 className="max-w-[9ch] text-[2.8rem] leading-[0.9] text-[color:var(--ink)] sm:text-[3.5rem] lg:text-[4.35rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d2a35f)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(184,135,70,0.22)] transition hover:opacity-95"
            >
              {primaryButtonLabel}
            </Link>
            <Link
              href="/sobre-nos"
              className="inline-flex items-center justify-center rounded-full border border-[rgba(183,146,107,0.28)] bg-white px-6 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
            >
              {secondaryButtonLabel}
            </Link>
          </div>

          <div className="grid w-full gap-3 text-sm text-slate-700 sm:grid-cols-2">
            {benefits.filter(Boolean).map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[1.25rem] border border-[rgba(194,162,119,0.16)] bg-white/80 px-4 py-3"
              >
                <span className="text-[color:var(--gold)]">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {imageUrl ? (
          <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] border border-[rgba(194,162,119,0.16)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(245,235,221,0.92))] shadow-[0_18px_40px_rgba(95,71,49,0.08)] sm:min-h-[360px] lg:min-h-[430px]">
            <Image
              src={imageUrl}
              alt={title}
              fill
              unoptimized
              priority
              className="object-cover object-center"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
