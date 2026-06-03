"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  MessageCircleMore,
  ShieldCheck,
  Star,
  TestTubeDiagonal,
  Truck,
} from "lucide-react";
import type { CatalogProduct } from "@/lib/types";

const heroPoints = [
  "Entrega Local Rapida",
  "Decants 5ml Disponiveis",
  "Atendimento Personalizado por WhatsApp",
];

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Perfumes 100% Originais",
    text: "Trabalhamos apenas com produtos autenticos.",
  },
  {
    icon: Truck,
    title: "Entrega Rapida na Ilha Terceira",
    text: "Entregas locais rapidas e seguras.",
  },
  {
    icon: MessageCircleMore,
    title: "Atendimento Personalizado",
    text: "Apoio dedicado pelo WhatsApp.",
  },
  {
    icon: TestTubeDiagonal,
    title: "Decants 5ml Disponiveis",
    text: "Experimente antes do frasco completo.",
  },
  {
    icon: Clock3,
    title: "Resposta Proxima",
    text: "Atendimento agil e humano.",
  },
  {
    icon: Star,
    title: "Selecao Exclusiva",
    text: "Os melhores perfumes para a tua montra.",
  },
];

function HeroProduct({
  product,
  featured = false,
}: {
  product?: CatalogProduct;
  featured?: boolean;
}) {
  if (!product?.imageUrl) {
    return (
      <div
        className={`flex h-full min-h-[320px] w-full items-center justify-center rounded-[2rem] border border-[rgba(194,162,119,0.22)] bg-[linear-gradient(180deg,_rgba(255,251,245,0.96),_rgba(245,231,211,0.96))] ${
          featured ? "p-10" : "p-8"
        }`}
      >
        <Image
          src="/logo-9-ilhas.svg"
          alt="9 Ilhas Perfumaria"
          width={320}
          height={96}
          className="h-auto w-40 opacity-90"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-[rgba(194,162,119,0.22)] bg-[radial-gradient(circle_at_top,_rgba(219,188,147,0.35),_transparent_55%),linear-gradient(180deg,_rgba(255,250,243,0.98),_rgba(244,230,209,0.98))] ${
        featured ? "h-[440px]" : "h-[340px]"
      }`}
    >
      <Image
        src={product.imageUrl}
        alt={product.name}
        fill
        priority={featured}
        unoptimized
        className="object-contain p-8"
      />
    </div>
  );
}

export function HeroHome({
  products,
}: {
  products: CatalogProduct[];
}) {
  const primaryProduct = products[0];
  const secondaryProduct = products[1];

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2.5rem] border border-[rgba(194,162,119,0.18)] bg-white shadow-[0_24px_60px_rgba(78,55,34,0.06)]">
        <div className="grid items-stretch gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-center px-7 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--gold)]">
              Bem-vindo a 9 Ilhas
            </p>
            <h1 className="mt-4 max-w-[10ch] text-[2.9rem] leading-[0.98] text-[color:var(--ink)] sm:text-[3.6rem] lg:text-[4.5rem]">
              Perfumes Originais na Ilha Terceira
            </h1>

            <p className="mt-5 max-w-2xl text-[1rem] leading-8 text-slate-600 lg:text-[1.05rem]">
              {heroPoints.join(" • ")}
            </p>

            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
              Descubra fragrancias exclusivas cuidadosamente selecionadas para quem
              procura qualidade, autenticidade e elegancia.
            </p>

            <div className="mt-8">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center rounded-md bg-[linear-gradient(135deg,_#b88746,_#d0a260)] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-white shadow-[0_16px_28px_rgba(184,135,70,0.22)] transition hover:translate-y-[-1px]"
              >
                Ver catalogo
              </Link>
            </div>

            <div className="mt-8 grid gap-3">
              {[
                "Perfumes 100% Originais",
                "Entrega rapida na Ilha Terceira",
                "Atendimento personalizado por WhatsApp",
                "Amostras disponiveis em 5ml",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(194,162,119,0.12)] text-[color:var(--gold)]">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(230,208,176,0.4),_transparent_48%),linear-gradient(180deg,_rgba(255,252,247,0.98),_rgba(244,229,208,0.98))] px-7 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.5),_transparent_62%)]" />
            <div className="relative grid items-end gap-5 lg:grid-cols-[0.58fr_0.42fr]">
              <HeroProduct product={primaryProduct} featured />
              <div className="grid gap-4">
                <HeroProduct product={secondaryProduct} />
                <div className="rounded-[1.8rem] border border-[rgba(194,162,119,0.18)] bg-white/78 px-5 py-5 shadow-[0_18px_30px_rgba(78,55,34,0.06)] backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--gold)]">
                    Selecao exclusiva
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Fragrancias escolhidas com atencao para uma montra confiante,
                    premium e facil de explorar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-6 rounded-[2.3rem] border border-[rgba(194,162,119,0.16)] bg-white px-6 py-8 shadow-[0_18px_42px_rgba(78,55,34,0.05)] sm:px-8 lg:px-10">
        <div className="flex items-center gap-5">
          <span className="h-px flex-1 bg-[color:var(--line)]" />
          <h2 className="text-center text-[1.85rem] uppercase tracking-[0.08em] text-[color:var(--ink)] sm:text-[2.1rem]">
            Porque escolher a 9 Ilhas?
          </h2>
          <span className="h-px flex-1 bg-[color:var(--line)]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {trustItems.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="px-3 py-2 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(194,162,119,0.26)] text-[color:var(--gold)]">
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-4 text-[1.15rem] leading-tight text-[color:var(--ink)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
