"use client";

import Link from "next/link";
import { Check, MessageCircleMore, ShieldCheck, Sparkles, Truck } from "lucide-react";
import type { PublicStoreSettings } from "@/lib/types";

const heroPoints = [
  "Perfumes 100% Originais",
  "Entrega rapida na Ilha Terceira",
  "Atendimento personalizado por WhatsApp",
  "Amostras disponiveis em 5ml",
];

const heroTrust = [
  {
    icon: ShieldCheck,
    label: "Originais verificados",
  },
  {
    icon: Truck,
    label: "Entrega local rapida",
  },
  {
    icon: MessageCircleMore,
    label: "Apoio por WhatsApp",
  },
  {
    icon: Sparkles,
    label: "Decants 5ml",
  },
];

export function HeroHome({ settings }: { settings: PublicStoreSettings }) {
  return (
    <section className="relative overflow-hidden rounded-[2.15rem] border border-[rgba(185,154,118,0.2)] bg-[radial-gradient(circle_at_top_left,_rgba(212,180,137,0.18),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(247,237,224,0.94))] p-6 shadow-[0_18px_46px_rgba(74,51,32,0.08)] sm:p-8 lg:p-10">
      <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(212,180,137,0.2),_transparent_70%)]" />
      <div className="relative mx-auto max-w-5xl space-y-7">
        <div className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
            Perfumaria 9 Ilhas
          </p>
          <h1 className="mx-auto max-w-[11.5ch] font-serif text-4xl leading-[0.98] text-[color:var(--ink)] sm:text-5xl lg:text-[4.1rem]">
            Perfumes originais com entrega proxima e confianca real.
          </h1>
          <p className="mx-auto max-w-3xl text-base leading-8 text-slate-600">
            Selecao cuidada de perfumes arabes para quem procura autenticidade, apoio humano e
            uma experiencia mais segura desde o primeiro contacto.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {heroPoints.map((point) => (
            <div
              key={point}
              className="flex items-center gap-3 rounded-[1.15rem] border border-[rgba(185,154,118,0.18)] bg-white/78 px-4 py-3 text-sm font-medium text-[color:var(--ink)] shadow-[0_10px_24px_rgba(74,51,32,0.05)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                <Check className="h-4 w-4" />
              </span>
              <span>{point}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/catalogo"
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(184,135,70,0.24)] transition hover:translate-y-[-1px]"
          >
            Ver catalogo
          </Link>
          <a
            href={`https://wa.me/${settings.whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-6 py-3.5 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
          >
            Falar por WhatsApp
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {heroTrust.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-[1.2rem] border border-[rgba(185,154,118,0.14)] bg-[rgba(255,250,243,0.8)] px-4 py-4"
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-sm leading-6 text-[color:var(--ink)]">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
