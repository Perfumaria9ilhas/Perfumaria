"use client";

import { ArrowUpRight, Check, ChevronUp, MapPinHouse, MessageCircleMore, PackageCheck, UserRoundCheck } from "lucide-react";

const accountBenefits = [
  "Guardar moradas de entrega",
  "Historico de encomendas",
  "Contacto mais rapido",
  "Entregas mais simples",
  "Acompanhamento personalizado",
];

const accountSignals = [
  {
    icon: MapPinHouse,
    title: "Moradas guardadas",
    text: "Termina a encomenda com muito menos passos nas proximas compras.",
  },
  {
    icon: PackageCheck,
    title: "Pedidos ligados ao perfil",
    text: "Fica mais facil acompanhar o que ja encomendou e repetir fragrancias.",
  },
  {
    icon: MessageCircleMore,
    title: "Resposta mais rapida",
    text: "O apoio por WhatsApp fica mais simples quando os dados ja estao associados.",
  },
];

export function AccountInviteHome() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[rgba(185,154,118,0.18)] bg-[linear-gradient(135deg,_rgba(255,254,251,0.98),_rgba(247,237,223,0.94))] p-6 shadow-[0_18px_44px_rgba(74,51,32,0.06)] sm:p-8 lg:p-9">
      <div className="absolute inset-y-0 right-0 hidden w-72 bg-[radial-gradient(circle_at_center,_rgba(212,180,137,0.2),_transparent_72%)] lg:block" />
      <div className="relative grid gap-7 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
              Acesso rapido
            </p>
            <h2 className="max-w-[13ch] font-serif text-[2.4rem] leading-[1.02] text-[color:var(--ink)] sm:text-[3rem]">
              Crie a sua conta em segundos.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-slate-600">
              Entre uma vez e deixe os proximos pedidos muito mais simples, organizados e
              confortaveis para si.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {accountBenefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-3 rounded-[1.2rem] border border-[rgba(185,154,118,0.16)] bg-white/85 px-4 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-[color:var(--ink)]">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-[1.8rem] border border-[rgba(185,154,118,0.18)] bg-white/92 p-5 shadow-[0_14px_34px_rgba(74,51,32,0.06)] sm:p-6">
          <div className="absolute -top-4 right-5 hidden items-center gap-2 rounded-full border border-[rgba(185,154,118,0.18)] bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)] shadow-sm lg:flex">
            <ChevronUp className="h-4 w-4" />
            Login no topo
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(185,154,118,0.16)] bg-[rgba(255,249,242,0.88)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)] lg:hidden">
            <ChevronUp className="h-3.5 w-3.5" />
            Procure o Login no topo
          </div>

          <div className="mb-5 flex items-center justify-between rounded-[1.3rem] border border-[rgba(185,154,118,0.14)] bg-[rgba(255,249,242,0.84)] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                <UserRoundCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Acesso cliente</p>
                <p className="text-sm font-semibold text-[color:var(--ink)]">
                  Use o botao Login no menu superior
                </p>
              </div>
            </div>
            <span className="hidden items-center gap-1 rounded-full bg-[rgba(195,153,100,0.14)] px-3 py-2 text-xs font-semibold text-[color:var(--gold)] sm:inline-flex">
              Ver no topo
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="grid gap-3">
            {accountSignals.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[1.25rem] border border-[rgba(185,154,118,0.14)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(250,243,233,0.86))] px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</p>
                      <p className="text-sm leading-6 text-slate-600">{item.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-sm leading-7 text-slate-600">
            Quando quiser criar a conta, basta tocar em <span className="font-semibold text-[color:var(--ink)]">Login</span> no
            topo. O registo abre logo a seguir, sem mudar a forma como a loja funciona.
          </p>
        </div>
      </div>
    </section>
  );
}
