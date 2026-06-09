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
  eyebrow,
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent lg:hidden" />

        <div className="relative flex min-h-[430px] flex-col justify-end px-6 py-7 text-white lg:min-h-[360px] lg:justify-center lg:px-12">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs uppercase tracking-[0.34em] text-white/80">
              {eyebrow}
            </p>

            <div>
              <h2 className="text-[2rem] leading-tight text-white sm:text-[2.5rem]">
                {title}
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85 sm:text-base">
                {description}
              </p>
            </div>

            <div>
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/12 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/60 hover:bg-white/18"
              >
                {buttonLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}