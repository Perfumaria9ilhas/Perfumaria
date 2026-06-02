"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ImagePlus,
  Lock,
  MessageCircleMore,
  ShieldCheck,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { submitStoreReview } from "@/actions/admin";

type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
};

type TrustHomeProps = {
  reviews: Review[];
  stats: {
    satisfiedCustomersCount: number;
    productsCount: number;
    islandsLabel: string;
  };
};

const trustItems = [
  "Perfumes autenticos",
  "Entregas locais na Ilha Terceira",
  "Atendimento por WhatsApp",
  "Apoio personalizado",
];

const confidenceCards = [
  {
    icon: ShieldCheck,
    title: "Perfumes autenticos",
    text: "Selecao cuidada para transmitir seguranca e autenticidade desde a primeira visita.",
  },
  {
    icon: Truck,
    title: "Entregas locais",
    text: "Resposta proxima e mais rapida para quem compra na Ilha Terceira.",
  },
  {
    icon: MessageCircleMore,
    title: "Atendimento por WhatsApp",
    text: "Apoio humano para tirar duvidas e orientar melhor cada escolha.",
  },
  {
    icon: Lock,
    title: "Pagamento seguro",
    text: "Processo direto, claro e pensado para inspirar confianca ao longo da compra.",
  },
  {
    icon: Users,
    title: "Clientes satisfeitos",
    text: "A reputacao da marca cresce com encomendas reais e repeticao de compra.",
  },
];

const futureProofBlocks = [
  {
    icon: MessageCircleMore,
    title: "Testemunhos",
    text: "Espaco preparado para destacar experiencias reais de clientes.",
  },
  {
    icon: ImagePlus,
    title: "Fotografias de entregas",
    text: "Zona pronta para mostrar entregas e proximidade com a Ilha Terceira.",
  },
  {
    icon: Star,
    title: "Avaliacoes de clientes",
    text: "Estrutura preparada para ganhar ainda mais prova social ao longo do tempo.",
  },
];

function renderStars(rating: number) {
  const safeRating = Math.max(0, Math.min(5, rating));

  return "★★★★★".slice(0, safeRating) + "☆☆☆☆☆".slice(0, 5 - safeRating);
}

export function TrustHome({ reviews, stats }: TrustHomeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(43,30,18,0.55)] px-4 py-6"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-[2rem] border border-[color:var(--line)] bg-white p-6 shadow-[0_25px_80px_rgba(43,30,18,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
                  Avaliacao
                </p>
                <h3 className="mt-2 font-serif text-3xl text-[color:var(--ink)]">
                  Deixe o seu comentario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-[color:var(--line)] px-3 py-2 text-xs font-semibold text-[color:var(--ink)]"
              >
                Fechar
              </button>
            </div>

            <form action={submitStoreReview} className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="O seu nome"
                className="w-full rounded-[1rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--gold)]"
                required
              />

              <select
                name="rating"
                defaultValue="5"
                className="w-full rounded-[1rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--gold)]"
              >
                <option value="5">5 estrelas</option>
                <option value="4">4 estrelas</option>
                <option value="3">3 estrelas</option>
                <option value="2">2 estrelas</option>
                <option value="1">1 estrela</option>
                <option value="0">0 estrelas</option>
              </select>

              <textarea
                name="comment"
                placeholder="Partilhe a sua opiniao sobre a loja"
                rows={5}
                className="w-full rounded-[1rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--gold)]"
                required
              />

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(184,135,70,0.22)]"
              >
                Enviar comentario
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <section id="avaliacoes" className="space-y-8 py-2">
        <div className="rounded-[2.15rem] border border-[rgba(185,154,118,0.18)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,238,225,0.95))] p-7 shadow-[0_18px_46px_rgba(74,51,32,0.06)] sm:p-9">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
                Prova social
              </p>
              <h2 className="font-serif text-[2.35rem] leading-tight text-[color:var(--ink)] sm:text-[3rem]">
                Uma marca que transmite confianca antes mesmo da primeira encomenda.
              </h2>
              <div className="flex flex-wrap gap-3">
                {trustItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(185,154,118,0.18)] bg-white/80 px-4 py-2 text-sm text-[color:var(--ink)]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[color:var(--gold)]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {confidenceCards.map((item, index) => {
                const Icon = item.icon;
                const metricValue =
                  index === 4
                    ? `+${stats.satisfiedCustomersCount}`
                    : index === 0
                      ? "+100%"
                      : index === 1
                        ? "Local"
                        : index === 2
                          ? "WhatsApp"
                          : "Seguro";

                return (
                  <article
                    key={item.title}
                    className="rounded-[1.35rem] border border-[rgba(185,154,118,0.16)] bg-white/84 p-5 shadow-[0_12px_28px_rgba(74,51,32,0.05)]"
                  >
                    <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="font-serif text-2xl text-[color:var(--ink)]">{metricValue}</p>
                    <h3 className="mt-3 font-serif text-[1.35rem] text-[color:var(--ink)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[2rem] border border-[rgba(185,154,118,0.18)] bg-white/95 p-7 shadow-[0_18px_46px_rgba(74,51,32,0.05)] sm:p-9">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
                  Comentarios reais
                </p>
                <h2 className="font-serif text-[2rem] leading-tight text-[color:var(--ink)] sm:text-[2.55rem]">
                  O que os clientes dizem depois de receber.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-600">
                  Comentarios reais ajudam novos clientes a comprar com mais seguranca.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
              >
                Fazer comentario
              </button>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {reviews.length ? (
                reviews.slice(0, 4).map((review) => (
                  <article
                    key={review.id}
                    className="rounded-[1.5rem] border border-[rgba(185,154,118,0.14)] bg-[linear-gradient(180deg,_rgba(255,250,243,0.85),_rgba(255,255,255,0.95))] p-5"
                  >
                    <p className="text-sm tracking-[0.14em] text-[color:#b98544]">
                      {renderStars(review.rating)}
                    </p>
                    <p className="mt-3 text-base leading-7 text-slate-700">{review.comment}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[color:var(--atlantic)]">
                      {review.name}
                    </p>
                  </article>
                ))
              ) : (
                <p className="md:col-span-2 text-sm leading-7 text-slate-500">
                  Ainda nao existem avaliacoes. Carregue em fazer comentario para deixar a primeira
                  opiniao.
                </p>
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-8 border-t border-[rgba(185,154,118,0.14)] pt-6 text-sm text-slate-600">
              <p>
                <span className="mr-2 font-serif text-3xl text-[color:var(--ink)]">
                  +{stats.satisfiedCustomersCount}
                </span>
                Clientes satisfeitos
              </p>
              <p>
                <span className="mr-2 font-serif text-3xl text-[color:var(--ink)]">
                  +{stats.productsCount}
                </span>
                Perfumes disponiveis
              </p>
              <p>
                <span className="mr-2 font-serif text-3xl text-[color:var(--ink)]">
                  {stats.islandsLabel}
                </span>
                Entregas para os Acores
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[rgba(185,154,118,0.18)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(247,237,224,0.95))] p-7 shadow-[0_18px_46px_rgba(74,51,32,0.05)] sm:p-9">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
                Estrutura preparada
              </p>
              <h2 className="font-serif text-[2rem] leading-tight text-[color:var(--ink)] sm:text-[2.45rem]">
                Espaço pronto para reforçar ainda mais a confiança.
              </h2>
              <p className="text-sm leading-7 text-slate-600">
                Esta zona pode crescer com a marca sem perder elegancia nem coerencia visual.
              </p>
            </div>

            <div className="mt-7 grid gap-4">
              {futureProofBlocks.map((block) => {
                const Icon = block.icon;

                return (
                  <article
                    key={block.title}
                    className="rounded-[1.35rem] border border-dashed border-[rgba(185,154,118,0.28)] bg-white/72 p-5"
                  >
                    <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-serif text-[1.35rem] text-[color:var(--ink)]">
                      {block.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{block.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
