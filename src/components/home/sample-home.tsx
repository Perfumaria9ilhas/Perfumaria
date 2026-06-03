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
    <div className="relative h-34 w-10 rounded-b-[1rem] rounded-t-[0.8rem] border border-[rgba(194,162,119,0.26)] bg-[linear-gradient(180deg,_#fffdf8,_#f6e7d0)] shadow-[0_10px_20px_rgba(78,55,34,0.06)]">
      <div className="absolute left-1/2 top-[-0.45rem] h-3 w-5 -translate-x-1/2 rounded-md bg-[color:var(--gold)]" />
      <div className="absolute left-1/2 top-3 h-[70%] w-[52%] -translate-x-1/2 rounded-[0.7rem] bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(242,222,193,0.95))]" />
      <div className="absolute inset-x-0 bottom-6 text-center text-[8px] font-semibold uppercase tracking-[0.28em] text-[color:var(--gold)]">
        9 Ilhas
      </div>
    </div>
  );
}

export function SampleHome() {
  return (
    <section className="overflow-hidden rounded-[2.3rem] border border-[rgba(194,162,119,0.16)] bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,237,223,0.96))] px-6 py-8 shadow-[0_18px_42px_rgba(78,55,34,0.05)] sm:px-8 lg:px-10">
      <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-wrap items-end justify-center gap-4 py-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={index % 2 === 0 ? "translate-y-0" : "translate-y-3"}>
              <DecantBottle />
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--gold)]">
              Amostras 5ml
            </p>
            <h2 className="mt-3 text-[2.35rem] leading-[1.03] text-[color:var(--ink)] sm:text-[2.9rem]">
              Experimente antes de comprar
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Descubra o perfume ideal sem compromisso. Disponivel em formato de 5ml
              para experimentar antes de investir num frasco completo.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(194,162,119,0.12)] text-[color:var(--gold)]">
                  <Check className="h-4 w-4" />
                </span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-md bg-[linear-gradient(135deg,_#b88746,_#d0a260)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_24px_rgba(184,135,70,0.2)]"
            >
              Ver decants
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
