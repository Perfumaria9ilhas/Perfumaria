"use client";

import {
  MessageCircleMore,
  ShieldCheck,
  Star,
  TestTubeDiagonal,
  Truck,
} from "lucide-react";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Perfumes 100% Originais",
    text: "Produtos autenticos",
  },
  {
    icon: Truck,
    title: "Entrega Rapida",
    text: "Ilha Terceira",
  },
  {
    icon: MessageCircleMore,
    title: "Apoio por WhatsApp",
    text: "Resposta proxima",
  },
  {
    icon: TestTubeDiagonal,
    title: "Decants 5ml",
    text: "Experimente primeiro",
  },
  {
    icon: Star,
    title: "Selecao Premium",
    text: "Escolha cuidada",
  },
  {
    icon: ShieldCheck,
    title: "Compra Segura",
    text: "Mais confianca",
  },
];

export function WhyChooseHome() {
  return (
    <section className="rounded-[1.45rem] border border-[rgba(194,162,119,0.14)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(249,242,232,0.78))] px-4 py-5 shadow-[0_10px_24px_rgba(78,55,34,0.04)] sm:px-5 lg:px-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-[rgba(194,162,119,0.24)]" />
        <h2 className="text-center text-[0.95rem] uppercase tracking-[0.14em] text-[color:var(--ink)]">
          Porque nos escolher?
        </h2>
        <span className="h-px flex-1 bg-[rgba(194,162,119,0.24)]" />
      </div>

      <div className="grid grid-cols-3 gap-x-3 gap-y-4 lg:grid-cols-6 lg:gap-x-4">
        {trustItems.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="flex flex-col items-center justify-start gap-1.5 px-1 py-1.5 text-center"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(194,162,119,0.2)] text-[color:var(--gold)]">
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="text-[0.73rem] leading-tight text-[color:var(--ink)] sm:text-[0.82rem]">
                {item.title}
              </h3>
              <p className="text-[10px] leading-4 text-slate-600 sm:text-[11px]">
                {item.text}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
