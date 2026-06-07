"use client";

import Image from "next/image";
import Link from "next/link";

function DecantBottle({
  label,
  caption,
}: {
  label: string;
  caption: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative flex h-28 w-12 items-end justify-center rounded-[1.1rem] border border-[rgba(194,162,119,0.22)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(249,238,220,0.96))] shadow-[0_10px_24px_rgba(95,71,49,0.08)]">
        <span className="absolute -top-2 h-3 w-5 rounded-full bg-[color:var(--gold)]" />
        <span className="absolute bottom-0 h-12 w-full rounded-b-[1rem] bg-[linear-gradient(180deg,_rgba(201,155,80,0.18),_rgba(180,122,54,0.32))]" />
        <span className="relative z-10 mb-6 text-[10px] font-semibold uppercase tracking-[0.26em] text-[color:var(--atlantic)]">
          {label}
        </span>
      </div>
      <span className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--gold)]">
        {caption}
      </span>
    </div>
  );
}

export function SampleHome({ imageUrl }: { imageUrl?: string | null }) {
  return (
    <section className="rounded-[2.2rem] border border-[rgba(194,162,119,0.16)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(250,243,234,0.94))] p-6 shadow-[0_18px_38px_rgba(95,71,49,0.06)]">
      <div className="grid items-center gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="flex flex-wrap items-end justify-center gap-5 lg:justify-start">
          <DecantBottle label="5ML" caption="Decant 5ml" />
          <DecantBottle label="10ML" caption="Decant 10ml" />
          {imageUrl ? (
            <div className="relative hidden h-28 w-32 overflow-hidden rounded-[1.4rem] border border-[rgba(194,162,119,0.18)] bg-white lg:block">
              <Image
                src={imageUrl}
                alt="Decants Perfumaria 9 Ilhas"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
            Serviço complementar
          </p>
          <div>
            <h2 className="text-[1.9rem] leading-tight text-[color:var(--ink)] sm:text-[2.5rem]">
              Experimente antes de comprar
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Decants de 5ml e 10ml disponíveis em perfumes selecionados.
            </p>
          </div>
          <div>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-full border border-[rgba(183,146,107,0.22)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
            >
              Ver Decants
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
