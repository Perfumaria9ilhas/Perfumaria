"use client";

import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

const sampleBenefits = [
  "Menor risco de compra",
  "Experimenta antes de investir no frasco completo",
  "Perfeito para descobrir novas fragrâncias",
  "Formato prático para viagem ou oferta",
];

export function SampleHome() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(185,154,118,0.2)] bg-[linear-gradient(135deg,_rgba(249,241,230,0.96),_rgba(255,255,255,0.96))] p-7 shadow-[0_18px_46px_rgba(74,51,32,0.06)] sm:p-9">
        <div className="absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_center,_rgba(212,180,137,0.22),_transparent_72%)]" />
        <div className="relative space-y-4">
          <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
            Tens dúvidas sobre um perfume?
          </p>
          <h2 className="max-w-[15ch] font-serif text-4xl leading-[1.02] text-[color:var(--ink)] sm:text-[3.2rem]">
            Experimenta primeiro em formato de 5ml.
          </h2>
          <p className="max-w-2xl text-base leading-8 text-slate-600">
            Experimenta primeiro em formato de 5ml antes de investir num frasco completo.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(184,135,70,0.22)]"
            >
              Ver perfumes
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(185,154,118,0.22)] bg-white/76 px-4 py-3 text-sm font-medium text-[color:var(--ink)]">
              <Sparkles className="h-4 w-4 text-[color:var(--gold)]" />
              Amostras disponíveis na loja
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-[rgba(185,154,118,0.16)] bg-white/88 p-7 shadow-[0_18px_46px_rgba(74,51,32,0.05)] sm:p-8">
        <div className="grid gap-4">
          {sampleBenefits.map((benefit) => (
            <div
              key={benefit}
              className="flex items-start gap-3 rounded-[1.2rem] border border-[rgba(185,154,118,0.16)] bg-[rgba(255,249,242,0.9)] px-4 py-4"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                <Check className="h-4 w-4" />
              </span>
              <p className="text-sm leading-6 text-slate-700">{benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
