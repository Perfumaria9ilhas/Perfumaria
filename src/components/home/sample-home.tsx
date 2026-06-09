"use client";

import Image from "next/image";
import Link from "next/link";

type SampleHomeProps = {
  imageUrl?: string | null;
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
};

export function SampleHome({
  imageUrl,
  title,
  description,
  buttonLabel,
}: SampleHomeProps) {
  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(194,162,119,0.16)] bg-[color:var(--sand-soft)] shadow-[0_18px_38px_rgba(95,71,49,0.06)]">
      <div className="relative min-h-[430px] lg:min-h-[360px]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Decants Perfumaria 9 Ilhas"
            fill
            unoptimized
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(250,243,234,0.94))]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

        <div className="relative flex min-h-[430px] flex-col px-6 py-7 text-white lg:min-h-[360px] lg:px-12">
          <div className="max-w-2xl">
            <h2 className="text-[2.2rem] font-semibold leading-[1.05] text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] sm:text-[2.8rem]">
              {title}
            </h2>
          </div>

          <div className="mt-auto grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <p className="max-w-3xl text-sm leading-7 text-white/95 sm:text-base">
              {description}
            </p>

            <Link
              href="/catalogo"
              className="inline-flex w-fit items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/70 hover:bg-white/20 lg:justify-self-end"
            >
              {buttonLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}