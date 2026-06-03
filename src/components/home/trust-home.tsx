"use client";

import { useState } from "react";
import { Camera, MessageCircleMore, ShieldCheck, Star, Truck } from "lucide-react";
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
  { icon: ShieldCheck, label: "Perfumes 100% Originais" },
  { icon: Truck, label: "Entrega Local" },
  { icon: MessageCircleMore, label: "Apoio por WhatsApp" },
  { icon: Camera, label: "Decants Disponiveis" },
  { icon: Star, label: "Atendimento Personalizado" },
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
                <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--gold)]">
                  Avaliacao
                </p>
                <h3 className="mt-2 text-3xl text-[color:var(--ink)]">Deixe o seu comentario</h3>
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

      <section className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.2rem] border border-[rgba(194,162,119,0.14)] bg-white px-4 py-4 text-center shadow-[0_10px_22px_rgba(78,55,34,0.04)]">
            <p className="text-[1.65rem] leading-none text-[color:var(--ink)]">
              +{stats.satisfiedCustomersCount}
            </p>
            <p className="mt-1.5 text-xs text-slate-600">Clientes satisfeitos</p>
          </div>
          <div className="rounded-[1.2rem] border border-[rgba(194,162,119,0.14)] bg-white px-4 py-4 text-center shadow-[0_10px_22px_rgba(78,55,34,0.04)]">
            <p className="text-[1.65rem] leading-none text-[color:var(--ink)]">
              +{stats.productsCount}
            </p>
            <p className="mt-1.5 text-xs text-slate-600">Perfumes disponiveis</p>
          </div>
          <div className="rounded-[1.2rem] border border-[rgba(194,162,119,0.14)] bg-white px-4 py-4 text-center shadow-[0_10px_22px_rgba(78,55,34,0.04)]">
            <p className="text-[1.65rem] leading-none text-[color:var(--ink)]">{stats.islandsLabel}</p>
            <p className="mt-1.5 text-xs text-slate-600">Entregas para os Acores</p>
          </div>
        </div>

        <div className="space-y-4 rounded-[1.8rem] border border-[rgba(194,162,119,0.14)] bg-white px-5 py-6 shadow-[0_12px_28px_rgba(78,55,34,0.04)] sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-[color:var(--line)]" />
            <h2 className="text-center text-[1.35rem] uppercase tracking-[0.08em] text-[color:var(--ink)] sm:text-[1.55rem]">
              O que dizem os nossos clientes
            </h2>
            <span className="h-px flex-1 bg-[color:var(--line)]" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {reviews.length ? (
              reviews.slice(0, 3).map((review) => (
                <article
                  key={review.id}
                  className="rounded-[1.2rem] border border-[rgba(194,162,119,0.12)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(250,241,229,0.9))] px-4 py-4 text-center"
                >
                  <p className="text-sm text-[color:#b98544]">{renderStars(review.rating)}</p>
                  <p className="mt-3 text-xs leading-6 text-slate-700">{review.comment}</p>
                  <p className="mt-4 text-xs font-semibold text-[color:var(--ink)]">{review.name}</p>
                </article>
              ))
            ) : (
              <div className="text-center text-sm leading-7 text-slate-600 lg:col-span-3">
                Ainda nao existem comentarios. Seja a primeira pessoa a comentar.
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center rounded-full border border-[rgba(194,162,119,0.2)] bg-white px-4 py-2.5 text-xs font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
            >
              Fazer comentario
            </button>
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-[linear-gradient(90deg,_#b88746,_#d1a15f)] px-5 py-4 text-white shadow-[0_12px_24px_rgba(184,135,70,0.16)]">
          <div className="grid gap-3 text-center sm:grid-cols-2 lg:grid-cols-5">
            {socialProofItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
