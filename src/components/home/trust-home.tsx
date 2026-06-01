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

      <section id="avaliacoes" className="space-y-8 px-1 py-4">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
            Confiança
          </p>
          <div className="flex flex-col gap-3 text-[color:var(--ink)] sm:flex-row sm:flex-wrap sm:gap-6">
            <p className="text-sm leading-6 text-slate-700">
              <span className="mr-2 font-serif text-3xl text-[color:var(--ink)]">
                +{stats.satisfiedCustomersCount}
              </span>
              Clientes satisfeitos
            </p>
            <p className="text-sm leading-6 text-slate-700">
              <span className="mr-2 font-serif text-3xl text-[color:var(--ink)]">
                +{stats.productsCount}
              </span>
              Produtos disponíveis
            </p>
            <p className="text-sm leading-6 text-slate-700">
              <span className="mr-2 font-serif text-3xl text-[color:var(--ink)]">
                {stats.islandsLabel}
              </span>
              Entregas para os Açores
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--atlantic)]">
                Avaliações
              </p>
              <h2 className="mt-2 font-serif text-[2rem] leading-tight text-[color:var(--ink)]">
                Comentários reais dos clientes.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
            >
              Fazer comentário
            </button>
          </div>

          {reviews.length ? (
            <div className="space-y-5">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="space-y-2 border-b border-[rgba(193,161,122,0.22)] pb-5 last:border-b-0 last:pb-0"
                >
                  <p className="text-sm tracking-[0.14em] text-[color:#b98544]">
                    {renderStars(review.rating)}
                  </p>
                  <p className="text-base leading-7 text-slate-700">{review.comment}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--atlantic)]">
                    {review.name}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-slate-500">
              Ainda não existem avaliações. Carregue em fazer comentário para deixar a primeira opinião.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
