"use client";

import Link from "next/link";
import { Check } from "lucide-react";

const benefits = [
  "Menor risco de compra",
  "Descoberta de novas fragrancias",
  "Ideal para oferecer",
  "Formato pratico para viagem",
];

function DecantBottle() {
  return (
    <div className="relative h-28 w-8 rounded-b-[0.9rem] rounded-t-[0.7rem] border border-[rgba(194,162,119,0.24)] bg-[linear-gradient(180deg,_#fffdf8,_#f6e7d0)] shadow-[0_8px_16px_rgba(78,55,34,0.05)]">
      <div className="absolute left-1/2 top-[-0.4rem] h-3 w-4 -translate-x-1/2 rounded-md bg-[color:var(--gold)]" />
      <div className="absolute left-1/2 top-3 h-[70%] w-[52%] -translate-x-1/2 rounded-[0.7rem] bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(242,222,193,0.95))]" />
      <div className="absolute inset-x-0 bottom-5 text-center text-[7px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)]">
        9 Ilhas
      </div>
    </div>
  );
}

export function SampleHome() {
  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-[rgba(194,162,119,0.14)] bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,237,223,0.96))] px-5 py-6 shadow-[0_12px_28px_rgba(78,55,34,0.04)] sm:px-6 lg:px-8">
      <div className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-wrap items-end justify-center gap-3 py-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={index % 2 === 0 ? "translate-y-0" : "translate-y-2"}>
              <DecantBottle />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[color:var(--gold)]">
              Amostras 5ml
            </p>
            <h2 className="mt-2 text-[1.8rem] leading-[1.04] text-[color:var(--ink)] sm:text-[2.15rem]">
              Experimente antes de comprar
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Descubra o perfume ideal sem compromisso. Disponivel em formato de 5ml
              para experimentar antes de investir num frasco completo.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2.5 text-[0.84rem] text-slate-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(194,162,119,0.12)] text-[color:var(--gold)]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-md bg-[linear-gradient(135deg,_#b88746,_#d0a260)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white shadow-[0_12px_22px_rgba(184,135,70,0.18)]"
            >
              Ver decants
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
