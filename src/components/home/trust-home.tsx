"use client";

import { useState } from "react";
import { Camera, CheckCircle2, MessageCircleMore, Star } from "lucide-react";
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

const socialProofItems = [
  "Perfumes autênticos",
  "Entregas locais na Ilha Terceira",
  "Atendimento por WhatsApp",
  "Apoio personalizado",
];

const futureBlocks = [
  {
    icon: MessageCircleMore,
    title: "Testemunhos",
    text: "Zona preparada para crescer com mais histórias reais de clientes.",
  },
  {
    icon: Camera,
    title: "Fotografias de entregas",
    text: "Espaço pronto para mostrar proximidade e entregas concluídas.",
  },
  {
    icon: Star,
    title: "Avaliações de clientes",
    text: "Comentários reais para reforçar ainda mais a confiança da marca.",
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
                  Avaliação
                </p>
                <h3 className="mt-2 font-serif text-3xl text-[color:var(--ink)]">
                  Deixe o seu comentário
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
                placeholder="Partilhe a sua opinião sobre a loja"
                rows={5}
                className="w-full rounded-[1rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--gold)]"
                required
              />

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#b88746,_#d1a15f)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(184,135,70,0.22)]"
              >
                Enviar comentário
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <section className="space-y-8 py-2">
        <div className="rounded-[2.2rem] border border-[rgba(194,162,119,0.18)] bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(246,235,218,0.94))] px-6 py-7 shadow-[0_18px_46px_rgba(78,55,34,0.06)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--gold)]">
                  Prova social
                </p>
                <h2 className="font-serif text-[2.3rem] leading-[1.02] text-[color:var(--ink)] sm:text-[3rem]">
                  Porque escolher a 9 Ilhas?
                </h2>
                <p className="max-w-2xl text-base leading-8 text-slate-600">
                  Uma base sólida de confiança para transformar a visita num pedido com mais
                  segurança e vontade de comprar.
                </p>
              </div>

              <div className="grid gap-3">
                {socialProofItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-[1.2rem] border border-[rgba(194,162,119,0.16)] bg-white/80 px-4 py-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-[color:var(--ink)]">{item}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.35rem] border border-[rgba(194,162,119,0.16)] bg-white/82 px-4 py-4 text-center">
                  <p className="font-serif text-[2rem] text-[color:var(--ink)]">
                    +{stats.satisfiedCustomersCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Clientes satisfeitos</p>
                </div>
                <div className="rounded-[1.35rem] border border-[rgba(194,162,119,0.16)] bg-white/82 px-4 py-4 text-center">
                  <p className="font-serif text-[2rem] text-[color:var(--ink)]">
                    +{stats.productsCount}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Perfumes disponíveis</p>
                </div>
                <div className="rounded-[1.35rem] border border-[rgba(194,162,119,0.16)] bg-white/82 px-4 py-4 text-center">
                  <p className="font-serif text-[2rem] text-[color:var(--ink)]">{stats.islandsLabel}</p>
                  <p className="mt-1 text-sm text-slate-600">Entregas para os Açores</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--gold)]">
                    O que dizem os nossos clientes
                  </p>
                  <h3 className="mt-3 font-serif text-[2rem] leading-tight text-[color:var(--ink)] sm:text-[2.45rem]">
                    Comentários reais
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-full border border-[rgba(194,162,119,0.2)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                >
                  Fazer comentário
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {reviews.length ? (
                  reviews.slice(0, 3).map((review) => (
                    <article
                      key={review.id}
                      className="rounded-[1.5rem] border border-[rgba(194,162,119,0.14)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(250,241,229,0.9))] p-5"
                    >
                      <p className="text-[color:#b98544]">{renderStars(review.rating)}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">{review.comment}</p>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--atlantic)]">
                        {review.name}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="md:col-span-3 text-sm leading-7 text-slate-600">
                    Ainda não existem comentários. Carregue em fazer comentário para deixar a
                    primeira opinião.
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {futureBlocks.map((block) => {
                  const Icon = block.icon;
                  return (
                    <div
                      key={block.title}
                      className="rounded-[1.35rem] border border-dashed border-[rgba(194,162,119,0.24)] bg-white/72 px-4 py-4"
                    >
                      <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(195,153,100,0.14)] text-[color:var(--gold)]">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <p className="font-semibold text-[color:var(--ink)]">{block.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{block.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
