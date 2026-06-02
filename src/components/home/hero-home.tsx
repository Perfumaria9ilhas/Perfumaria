"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, MessageCircleMore, ShieldCheck, TestTubeDiagonal, Truck } from "lucide-react";
import type { CatalogProduct, PublicStoreSettings } from "@/lib/types";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Perfumes 100% originais",
    text: "Trabalhamos com fragrâncias selecionadas para transmitir confiança desde o primeiro contacto.",
  },
  {
    icon: Truck,
    title: "Entrega rápida na Ilha Terceira",
    text: "Acompanhamento próximo para entregas locais mais simples e confortáveis.",
  },
  {
    icon: MessageCircleMore,
    title: "Atendimento por WhatsApp",
    text: "Resposta humana, rápida e personalizada para orientar cada encomenda.",
  },
  {
    icon: TestTubeDiagonal,
    title: "Amostras disponíveis em 5ml",
    text: "Experimente primeiro e compre com mais segurança antes do frasco completo.",
  },
];

function HeroBottle({
  product,
  priority = false,
  className = "",
}: {
  product?: CatalogProduct;
  priority?: boolean;
  className?: string;
}) {
  if (!product?.imageUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-[2rem] border border-[rgba(194,162,119,0.24)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(247,233,214,0.92))] ${className}`}
      >
        <Image
          src="/logo-9-ilhas.svg"
          alt="9 Ilhas Perfumaria"
          width={240}
          height={90}
          className="h-auto w-32 opacity-90 sm:w-40"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-[rgba(194,162,119,0.24)] bg-[radial-gradient(circle_at_top,_rgba(224,193,150,0.28),_transparent_58%),linear-gradient(180deg,_rgba(255,251,245,0.98),_rgba(244,229,209,0.98))] shadow-[0_20px_42px_rgba(78,55,34,0.12)] ${className}`}
    >
      <div className="relative h-full w-full">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          priority={priority}
          unoptimized
          className="object-contain p-5 sm:p-7"
        />
      </div>
    </div>
  );
}

export function HeroHome({
  settings,
  products,
}: {
  settings: PublicStoreSettings;
  products: CatalogProduct[];
}) {
  const primaryProduct = products[0];
  const secondaryProduct = products[1];

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2.25rem] border border-[rgba(194,162,119,0.24)] bg-[linear-gradient(135deg,_rgba(255,251,245,0.98),_rgba(243,229,208,0.98))] shadow-[0_24px_70px_rgba(78,55,34,0.10)]">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--gold)]">
              Bem-vindo à 9 Ilhas
            </p>
            <h1 className="mt-4 max-w-[12ch] font-serif text-[2.6rem] leading-[0.96] text-[color:var(--ink)] sm:text-[3.5rem] lg:text-[4.35rem]">
              Perfumes Originais na Ilha Terceira
            </h1>
            <p className="mt-5 max-w-2xl text-[1rem] leading-8 text-slate-600 lg:text-[1.06rem]">
              Entrega local rápida, decants 5ml disponíveis e atendimento personalizado por
              WhatsApp para ajudar a escolher com mais confiança.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                "Perfumes 100% Originais",
                "Entrega rápida na Ilha Terceira",
                "Atendimento personalizado por WhatsApp",
                "Amostras disponíveis em 5ml",
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(194,162,119,0.2)] bg-white/88 px-4 py-2 text-sm text-[color:var(--ink)] shadow-[0_8px_18px_rgba(78,55,34,0.05)]"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </span>
              ))}
            </div>

            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600">
              Descubra fragrâncias cuidadosamente selecionadas para quem procura autenticidade,
              elegância e uma experiência de compra mais segura.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(184,135,70,0.24)] transition hover:translate-y-[-1px]"
              >
                Ver catálogo
              </Link>
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-[rgba(194,162,119,0.24)] bg-white px-6 py-3.5 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
              >
                Falar por WhatsApp
              </a>
            </div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden px-6 py-8 sm:px-9 lg:min-h-[620px] lg:px-10 lg:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(214,183,142,0.35),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(157,120,84,0.16),_transparent_30%)]" />
            <div className="absolute right-5 top-5 h-32 w-32 rounded-full bg-[rgba(255,255,255,0.28)] blur-3xl sm:h-44 sm:w-44" />
            <div className="relative flex h-full items-end justify-center">
              <HeroBottle
                product={secondaryProduct}
                className="absolute left-[4%] top-[8%] h-[56%] w-[36%] rotate-[-4deg] lg:left-[8%] lg:top-[11%] lg:h-[60%] lg:w-[34%]"
              />
              <HeroBottle
                product={primaryProduct}
                priority
                className="relative z-10 h-[86%] w-[54%] lg:h-[88%] lg:w-[50%]"
              />
              <div className="absolute bottom-3 right-0 max-w-[220px] rounded-[1.4rem] border border-[rgba(194,162,119,0.18)] bg-white/80 px-4 py-3 text-right shadow-[0_12px_24px_rgba(78,55,34,0.08)] backdrop-blur sm:px-5 sm:py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--gold)]">
                  Seleção exclusiva
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Fragrâncias escolhidas com atenção para uma montra mais confiante e premium.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {trustPoints.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="rounded-[1.7rem] border border-[rgba(194,162,119,0.18)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(250,241,229,0.94))] px-5 py-5 shadow-[0_14px_28px_rgba(78,55,34,0.05)]"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="font-serif text-[1.45rem] leading-tight text-[color:var(--ink)]">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
