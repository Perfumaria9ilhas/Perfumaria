"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

const benefits = [
  "Menor risco de compra",
  "Descoberta de novas fragrancias",
  "Ideal para oferecer",
  "Formato pratico para viagem",
];

export function SampleHome({ imageUrl }: { imageUrl?: string | null }) {
  return (
    <section className="bg-transparent px-0 py-0">
      <div className="grid items-center gap-4 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="relative overflow-hidden">
          <div className="relative aspect-[16/7]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Decants 5ml"
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,_#fffdf8,_#f6e7d0)] p-6">
                <Image
                  src="/logo-9-ilhas.svg"
                  alt="9 Ilhas Perfumaria"
                  width={240}
                  height={80}
                  className="h-auto w-32 opacity-80"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 px-0.5">
          <div>
            <h2 className="text-[1.55rem] leading-[1.04] text-[color:var(--ink)] sm:text-[1.95rem]">
              Experimente antes de comprar
            </h2>
            <p className="mt-2.5 max-w-2xl text-[13px] leading-6 text-slate-600">
              Descubra o perfume ideal sem compromisso. Disponivel em formato de 5ml
              para experimentar antes de investir num frasco completo.
            </p>
          </div>

          <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2.5 text-[0.78rem] text-slate-700">
                <span className="text-[color:var(--gold)]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-md bg-[linear-gradient(135deg,_#b88746,_#d0a260)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white"
            >
              Ver decants
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
