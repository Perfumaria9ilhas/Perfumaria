"use client";

import { useState } from "react";
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

function renderStars(rating: number) {
  const safeRating = Math.max(0, Math.min(5, rating));
  return "★★★★★".slice(0, safeRating) + "☆☆☆☆☆".slice(0, 5 - safeRating);
}

export function TrustHome({ reviews }: TrustHomeProps) {
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
                  Avaliação
                </p>
                <h3 className="mt-2 text-3xl text-[color:var(--ink)]">Deixe o seu comentário</h3>
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

      <section className="space-y-6">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--gold)]">
            Testemunhos
          </p>
          <h2 className="text-[2rem] leading-tight text-[color:var(--ink)] sm:text-[2.6rem]">
            O que dizem os nossos clientes
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {reviews.length ? (
            reviews.slice(0, 3).map((review) => (
              <article
                key={review.id}
                className="rounded-[1.8rem] border border-[rgba(194,162,119,0.16)] bg-white/92 px-5 py-6 text-center shadow-[0_14px_30px_rgba(95,71,49,0.05)]"
              >
                <p className="text-sm text-[color:#b98544]">{renderStars(review.rating)}</p>
                <p className="mt-4 text-sm leading-7 text-slate-700">{review.comment}</p>
                <p className="mt-5 text-sm font-semibold text-[color:var(--ink)]">{review.name}</p>
              </article>
            ))
          ) : (
            <div className="rounded-[1.8rem] border border-[rgba(194,162,119,0.16)] bg-white/92 px-5 py-10 text-center text-sm leading-7 text-slate-600 lg:col-span-3">
              Ainda não existem comentários. Seja a primeira pessoa a comentar.
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-full border border-[rgba(194,162,119,0.2)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
          >
            Fazer comentário
          </button>
        </div>
      </section>
    </>
  );
}
