"use client";

import {
  MessageCircleMore,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";

const trustItems = [
  {
    icon: Truck,
    title: "Entrega rápida na Ilha Terceira",
    text: "Receba com rapidez e acompanhamento próximo.",
  },
  {
    icon: Truck,
    title: "Envio para Açores, Madeira e Portugal Continental",
    text: "Preparamos cada encomenda com atenção e segurança.",
  },
  {
    icon: ShieldCheck,
    title: "Perfumes 100% Originais",
    text: "Selecionamos referências autênticas e confiáveis.",
  },
  {
    icon: MessageCircleMore,
    title: "Atendimento via WhatsApp",
    text: "Respondemos de forma próxima e personalizada.",
  },
  {
    icon: PackageCheck,
    title: "Pagamento Seguro",
    text: "Confirmação clara antes de finalizar a encomenda.",
  },
];

export function WhyChooseHome() {
  return (
    <section className="space-y-6">
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
          Confiança
        </p>
        <h2 className="text-[2rem] leading-tight text-[color:var(--ink)] sm:text-[2.6rem]">
          Porque Comprar na Perfumaria 9 Ilhas?
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {trustItems.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="rounded-[1.8rem] border border-[rgba(194,162,119,0.18)] bg-white/92 p-5 shadow-[0_14px_34px_rgba(95,71,49,0.06)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(183,146,107,0.12)] text-[color:var(--gold)]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-[1.05rem] leading-snug text-[color:var(--ink)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
