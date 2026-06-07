"use client";

import Link from "next/link";

export function HeroHome() {
  return (
    <section className="overflow-hidden rounded-[2.4rem] border border-[rgba(194,162,119,0.16)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(249,242,232,0.95))] px-6 py-10 shadow-[0_22px_48px_rgba(95,71,49,0.07)] sm:px-8 sm:py-12 lg:px-14 lg:py-16">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-6 text-left">
        <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
          Bem-vindo à 9 Ilhas
        </p>

        <div className="space-y-4">
          <h1 className="max-w-[12ch] text-[2.8rem] leading-[0.9] text-[color:var(--ink)] sm:text-[3.8rem] lg:text-[5rem]">
            Perfumes Árabes Originais
          </h1>
          <p className="max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Fragrâncias selecionadas com entrega rápida na Ilha Terceira e envios para
            Açores, Madeira e Portugal Continental.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d2a35f)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(184,135,70,0.22)] transition hover:opacity-95"
          >
            Ver Catálogo
          </Link>
          <Link
            href="/sobre-nos"
            className="inline-flex items-center justify-center rounded-full border border-[rgba(183,146,107,0.28)] bg-white px-6 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
          >
            Sobre Nós
          </Link>
        </div>

        <div className="grid w-full gap-3 text-sm text-slate-700 sm:grid-cols-2">
          {[
            "Perfumes 100% Originais",
            "Entrega rápida na Ilha Terceira",
            "Atendimento personalizado por WhatsApp",
            "Amostras disponíveis em 5ml",
          ].map((item) => (
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
    </section>
  );
}
