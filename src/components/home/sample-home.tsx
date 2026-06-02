"use client";

import Link from "next/link";
import { Check, TestTubeDiagonal } from "lucide-react";

const sampleBenefits = [
  "Menor risco de compra",
  "Descoberta de novas fragrâncias",
  "Ideal para oferecer",
  "Formato prático para viagem",
];

function DecantBottle() {
  return (
    <div className="relative h-28 w-9 rounded-[1rem] border border-[rgba(191,156,111,0.32)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(245,232,211,0.98))] shadow-[0_10px_18px_rgba(78,55,34,0.08)]">
      <div className="absolute left-1/2 top-[-9px] h-4 w-4 -translate-x-1/2 rounded-[0.35rem] bg-[linear-gradient(180deg,_#bd9157,_#8b6534)]" />
      <div className="absolute left-1/2 top-[14px] h-12 w-[1px] -translate-x-1/2 bg-[rgba(168,131,90,0.22)]" />
      <div className="absolute inset-x-[6px] bottom-4 top-8 rounded-[0.65rem] bg-[linear-gradient(180deg,_rgba(244,221,170,0.65),_rgba(191,137,68,0.55))]" />
      <div className="absolute inset-x-[5px] bottom-[30px] rounded-[0.3rem] border border-[rgba(170,131,88,0.22)] bg-white/78 px-1 py-[2px] text-center text-[7px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
        9I
      </div>
    </div>
  );
}

export function SampleHome() {
  return (
    <section className="overflow-hidden rounded-[2.2rem] border border-[rgba(194,162,119,0.18)] bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(247,237,223,0.96))] px-6 py-7 shadow-[0_18px_46px_rgba(78,55,34,0.06)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(194,162,119,0.2)] bg-[rgba(255,249,241,0.92)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--gold)]">
            <TestTubeDiagonal className="h-4 w-4" />
            Amostras 5ml
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <DecantBottle key={index} />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--gold)]">
              Experimente antes de comprar
            </p>
            <h2 className="font-serif text-[2.4rem] leading-[1] text-[color:var(--ink)] sm:text-[3.1rem]">
              Decants 5ml
            </h2>
            <p className="max-w-2xl text-base leading-8 text-slate-600">
              Descubra o perfume ideal sem compromisso. Disponível em formato de 5ml para
              experimentar antes de investir num frasco completo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {sampleBenefits.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[1.2rem] border border-[rgba(194,162,119,0.16)] bg-white/80 px-4 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-sm text-[color:var(--ink)]">{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(184,135,70,0.22)]"
            >
              Ver decants
            </Link>
            <span className="inline-flex items-center rounded-full border border-[rgba(194,162,119,0.18)] bg-white/82 px-4 py-3 text-sm text-slate-600">
              Mais confiança antes da compra
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
