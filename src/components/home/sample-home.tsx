"use client";

import Link from "next/link";
import { Check, Sparkles, TestTubeDiagonal } from "lucide-react";

const sampleBenefits = [
  {
    title: "Menor risco de compra",
    text: "Uma forma simples de testar a fragrancia antes de escolher o frasco completo.",
  },
  {
    title: "Descoberta de novas fragrancias",
    text: "Experimente perfumes diferentes sem investir logo num formato maior.",
  },
  {
    title: "Ideal para oferta ou viagem",
    text: "Pratico para levar consigo ou oferecer a quem gosta de descobrir aromas.",
  },
  {
    title: "Primeiro contacto sem compromisso",
    text: "Ajuda a comprar com mais certezas e muito menos hesitacao.",
  },
];

export function SampleHome() {
  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(185,154,118,0.22)] bg-[radial-gradient(circle_at_top_left,_rgba(226,193,148,0.28),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(162,122,85,0.14),_transparent_30%),linear-gradient(135deg,_rgba(255,253,249,0.98),_rgba(246,234,218,0.96))] p-6 shadow-[0_22px_56px_rgba(74,51,32,0.08)] sm:p-8 lg:p-10">
      <div className="absolute right-[-5rem] top-[-4rem] h-44 w-44 rounded-full bg-[rgba(212,180,137,0.18)] blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(185,154,118,0.18)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--gold)]">
            <TestTubeDiagonal className="h-4 w-4" />
            Amostras 5ml
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
              Experimente antes de comprar
            </p>
            <h2 className="max-w-[12ch] font-serif text-4xl leading-[1.02] text-[color:var(--ink)] sm:text-[3.15rem]">
              Descubra o perfume ideal sem compromisso.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-slate-600">
              Descubra o perfume ideal sem compromisso. Disponível em formato de 5ml.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(184,135,70,0.22)]"
            >
              Ver amostras
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(185,154,118,0.2)] bg-white/82 px-4 py-3 text-sm font-medium text-[color:var(--ink)]">
              <Sparkles className="h-4 w-4 text-[color:var(--gold)]" />
              Ideal para decidir com mais confiança
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {sampleBenefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className={`flex items-start gap-3 rounded-[1.3rem] border border-[rgba(185,154,118,0.16)] px-4 py-4 shadow-[0_10px_24px_rgba(74,51,32,0.04)] ${
                index === 0
                  ? "bg-[linear-gradient(180deg,_rgba(255,255,255,0.97),_rgba(250,242,232,0.96))]"
                  : "bg-white/82"
              }`}
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                <Check className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[color:var(--ink)]">{benefit.title}</p>
                <p className="text-sm leading-6 text-slate-600">{benefit.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
